import sys
import typing as tp
import itertools
import copy
import json
import io
import base64
from multiprocessing import Pool, cpu_count, freeze_support
import time

from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin

from pymatgen.core.structure import Structure
from pymatgen.core.lattice import Lattice
from pymatgen.core.periodic_table import Element
from pymatgen.analysis.local_env import CrystalNN
from pymatgen.symmetry.analyzer import SpacegroupAnalyzer
from ase.data import chemical_symbols, vdw_radii, covalent_radii
from matplotlib.colors import to_hex
from matscipy.neighbours import neighbour_list
import numpy as np
import networkx as nx
import matplotlib

matplotlib.use("agg")

# import pyvista as pv

from OgreInterface.plotting_tools.colors import vesta_colors

from OgreInterface.miller import MillerSearch
from OgreInterface.surfaces import OrientedBulk
from OgreInterface.lattice_match import ZurMcGill
from OgreInterface import utils as ogre_utils
from OgreInterface.plotting_tools import plot_match
from OgreInterface.generate import SurfaceGenerator, InterfaceGenerator
from OgreInterface.surface_matching import (
    IonicSurfaceEnergy,
    IonicSurfaceMatcher,
)
from OgreInterface.workflows.interface_search import IonicInterfaceSearch

app = Flask(__name__)
app_config = {"host": "0.0.0.0", "port": sys.argv[1]}
# app_config = {"host": "0.0.0.0", "port": "5000"}

"""
---------------------- DEVELOPER MODE CONFIG -----------------------
"""
# Developer mode uses app.py
if "app.py" in sys.argv[0]:
    # Update app config
    app_config["debug"] = True

    # CORS settings
    cors = CORS(
        app,
        resources={r"/*": {"origins": "http://localhost*"}},
    )

    # CORS headers
    app.config["CORS_HEADERS"] = "Content-Type"

"""
--------------------------- UTILS -----------------------------  
"""


def _get_formatted_formula(formula: str) -> str:
    groups = itertools.groupby(formula, key=lambda x: x.isdigit())

    formatted_formula = []
    for k, group in groups:
        if k:
            data = ["sub", {}, "".join(list(group))]
        else:
            data = ["span", {}, "".join(list(group))]

        formatted_formula.append(data)

    return formatted_formula


def _get_formatted_spacegroup(spacegroup: str) -> str:
    formatted_spacegroup = []

    i = 0
    while i < len(spacegroup):
        s = spacegroup[i]
        if s == "_":
            data = ["sub", {}, spacegroup[i + 1]]
            formatted_spacegroup.append(data)
            i += 2
        if s == "-":
            data = [
                "span",
                {"style": {"textDecoration": "overline"}},
                spacegroup[i + 1],
            ]
            formatted_spacegroup.append(data)
            i += 2
        else:
            data = ["span", {}, spacegroup[i]]
            formatted_spacegroup.append(data)
            i += 1

    return formatted_spacegroup


def _get_formatted_miller_index(miller_index: str) -> str:
    formatted_miller_index = [
        ["span", {}, "("],
    ]

    i = 0
    while i < len(miller_index):
        s = miller_index[i]
        if s == "-":
            data = [
                "span",
                {"style": {"textDecoration": "overline"}},
                miller_index[i + 1],
            ]
            formatted_miller_index.append(data)
            i += 2
        else:
            data = ["span", {}, miller_index[i]]
            formatted_miller_index.append(data)
            i += 1

    formatted_miller_index.append(["span", {}, ")"])

    return formatted_miller_index


def _get_neighbor_graph(
    structure: Structure,
) -> tp.Dict[str, tp.List[tp.Dict[str, tp.Any]]]:
    rounded_structure = ogre_utils.get_rounded_structure(
        structure,
        tol=6,
    )

    lattice = rounded_structure.lattice
    composition = rounded_structure.composition.reduced_formula
    atomic_numbers = rounded_structure.atomic_numbers

    cell_bound_shifts = {}

    frac_coords = rounded_structure.frac_coords

    cell_bound_shifts = {}

    for i, frac_coord in enumerate(frac_coords):
        zero_elements = np.isclose(frac_coord, 0.0)

        if zero_elements.sum() > 0:
            image_shift = list(
                itertools.product([0, 1], repeat=zero_elements.sum())
            )[1:]

            all_shifts = []

            for shift in image_shift:
                image = np.zeros(3).astype(int)
                image[zero_elements] += np.array(shift).astype(int)
                all_shifts.append(image)

            cell_bound_shifts[i] = np.vstack(all_shifts)

    atoms = ogre_utils.get_atoms(rounded_structure)
    init_from_idx, init_to_idx, init_d, init_to_image = neighbour_list(
        "ijdS",
        atoms=atoms,
        cutoff=6.0,
    )

    init_to_image = init_to_image.astype(int)
    init_from_image = np.zeros((len(init_from_idx), 3)).astype(int)

    new_from_idx = []
    new_to_idx = []
    new_from_image = []
    new_to_image = []
    new_d = []

    for from_idx_to_shift, images in cell_bound_shifts.items():
        mask = init_from_idx == from_idx_to_shift

        for img in images:
            new_from_idx.append(init_from_idx[mask])
            new_to_idx.append(init_to_idx[mask])
            new_d.append(init_d[mask])
            new_from_image.append(init_from_image[mask] + img)
            new_to_image.append(init_to_image[mask] + img)

    from_idx = np.concatenate([init_from_idx, *new_from_idx]).astype(int)
    to_idx = np.concatenate([init_to_idx, *new_to_idx]).astype(int)
    d = np.concatenate([init_d, *new_d])
    from_image = np.concatenate(
        [init_from_image, *new_from_image],
        axis=0,
    ).astype(int)
    to_image = np.concatenate(
        [init_to_image, *new_to_image],
        axis=0,
    ).astype(int)

    to_atom_keys = np.c_[to_idx, to_image]
    from_atom_keys = np.c_[from_idx, from_image]

    in_cell_atom_keys = np.unique(from_atom_keys, axis=0)

    in_cell_atom_set = {
        "".join([str(i) for i in key]) for key in in_cell_atom_keys
    }

    all_atom_keys = np.concatenate(
        [to_atom_keys, from_atom_keys],
        axis=0,
    )
    unique_atom_keys = np.unique(all_atom_keys, axis=0)

    atom_info_dict = {}

    graph = nx.Graph()

    for key in unique_atom_keys:
        node = "".join([str(i) for i in key])
        idx = key[0]
        image = key[1:]
        frac_coord = frac_coords[idx] + image
        cart_coord = lattice.get_cartesian_coords(frac_coord)

        Z = int(atomic_numbers[idx])
        color = vesta_colors[Z].astype(float).tolist()

        node_attributes = {
            "inCell": node in in_cell_atom_set,
            "position": cart_coord,
            "color": to_hex(color),
            "atomicNumber": Z,
            "radius": _get_radius(Z),
            "chemicalSymbol": chemical_symbols[Z],
        }

        atom_info_dict[node] = node_attributes

        graph_node_attributes = node_attributes.copy()
        graph_node_attributes["position"] = _three_flip(
            node_attributes["position"].astype(float).tolist(),
        )

        graph.add_node(node, attributes=graph_node_attributes)

    for i in range(len(to_idx)):
        to_key = "".join([str(j) for j in to_atom_keys[i]])
        from_key = "".join([str(j) for j in from_atom_keys[i]])

        sorted_edge = sorted([to_key, from_key])
        to_attributes = atom_info_dict[to_key]
        from_attributes = atom_info_dict[from_key]

        to_position = to_attributes["position"]
        to_radius = to_attributes["radius"]
        to_Z = to_attributes["atomicNumber"]

        from_position = from_attributes["position"]
        from_radius = from_attributes["radius"]
        from_Z = from_attributes["atomicNumber"]

        sorted_Z = sorted([to_Z, from_Z])
        atomic_number_key = (
            f"{chemical_symbols[sorted_Z[0]]}-{chemical_symbols[sorted_Z[1]]}"
        )

        bond_vector = to_position - from_position
        norm_bond_vector = bond_vector / np.linalg.norm(bond_vector)

        from_atom_edge = from_position + (from_radius * norm_bond_vector)
        to_atom_edge = to_position - (to_radius * norm_bond_vector)

        center_position = 0.5 * (from_atom_edge + to_atom_edge)
        from_bond_data = {
            "toPosition": _three_flip(center_position.astype(float).tolist()),
            "fromPosition": _three_flip(from_position.astype(float).tolist()),
            "color": from_attributes["color"],
        }
        to_bond_data = {
            "toPosition": _three_flip(center_position.astype(float).tolist()),
            "fromPosition": _three_flip(to_position.astype(float).tolist()),
            "color": to_attributes["color"],
        }

        graph.add_edge(
            sorted_edge[0],
            sorted_edge[1],
            key=f"{sorted_edge[0]}->{sorted_edge[1]}",
            attributes={
                "bondLength": float(d[i]),
                "atomicNumberKey": atomic_number_key,
                "bonds": [
                    from_bond_data,
                    to_bond_data,
                ],
            },
        )

    graph_data = nx.node_link_data(
        graph,
        source="source",
        target="target",
        name="key",
        key="key",
        link="edges",
    )

    graphology_data = {
        "attributes": {"name": composition},
        "nodes": graph_data["nodes"],
        "edges": graph_data["edges"],
    }

    return graphology_data


def _get_bond_info(
    structure: Structure,
    bond_dict_site_property: str = "base_index",
) -> tp.Dict[int, tp.Dict[str, tp.Union[np.ndarray, int]]]:
    oxi_struc = structure.copy()
    oxi_struc.add_oxidation_state_by_guess()
    cnn = CrystalNN(search_cutoff=7.0, cation_anion=True)

    bond_dict = {}

    for i in range(len(structure)):
        info_dict = cnn.get_nn_info(oxi_struc, i)
        center_site = oxi_struc[i]
        center_coords = center_site.coords
        center_props = center_site.properties

        bonds = []
        to_Zs = []
        from_Zs = [center_site.specie.Z] * len(info_dict)
        to_eqs = []
        from_eqs = [center_props[bond_dict_site_property]] * len(info_dict)

        for neighbor in info_dict:
            neighbor_site = neighbor["site"]
            neighbor_props = neighbor["site"].properties
            neighbor_coords = neighbor_site.coords
            bond_vector = neighbor_coords - center_coords
            bonds.append(bond_vector)
            to_Zs.append(neighbor_site.specie.Z)
            to_eqs.append(neighbor_props[bond_dict_site_property])

        bonds = np.array(bonds)
        to_Zs = np.array(to_Zs).astype(int)
        from_Zs = np.array(from_Zs).astype(int)
        to_eqs = np.array(to_eqs).astype(int)
        from_eqs = np.array(from_eqs).astype(int)

        bond_dict[i] = {
            "bond_vectors": bonds,
            "to_Zs": to_Zs,
            "from_Zs": from_Zs,
            "to_site_index": to_eqs,
            "from_site_index": from_eqs,
        }

    return bond_dict


def _get_rounded_structure(structure: Structure):
    return Structure(
        lattice=structure.lattice,
        species=structure.species,
        coords=np.mod(np.round(structure.frac_coords, 6), 1.0),
        coords_are_cartesian=False,
        to_unit_cell=True,
        site_properties=structure.site_properties,
    )


def _get_plotting_information(
    structure: Structure,
    bond_dict: tp.Dict[int, tp.Dict[str, tp.Union[np.ndarray, int]]],
    bond_dict_site_propery: str = "base_index",
):
    structure = ogre_utils.get_rounded_structure(structure)

    lattice = structure.lattice

    atoms_to_show = []
    atom_Zs = []
    atom_site_indices = []

    for i, site in enumerate(structure):
        site_index = site.properties[bond_dict_site_propery]
        bond_info = bond_dict[site_index]
        cart_coords = site.coords
        bonds = bond_info["bond_vectors"]

        atoms_to_show.append(cart_coords)
        atoms_to_show.append(bonds + cart_coords[None, :])

        atom_Zs.append([site.specie.Z])
        atom_Zs.append(bond_info["to_Zs"])

        atom_site_indices.append([site_index])
        atom_site_indices.append(bond_info["to_site_index"])

        frac_coords = np.round(site.frac_coords, 6)
        zero_frac_coords = frac_coords == 0.0

        if zero_frac_coords.sum() > 0:
            image_shift = list(
                itertools.product([0, 1], repeat=zero_frac_coords.sum())
            )[1:]
            for shift in image_shift:
                image = np.zeros(3)
                image[zero_frac_coords] += np.array(shift)
                image_frac_coords = frac_coords + image
                image_cart_coords = lattice.get_cartesian_coords(
                    image_frac_coords
                )
                atoms_to_show.append(image_cart_coords)
                atoms_to_show.append(bonds + image_cart_coords)

                atom_Zs.append([site.specie.Z])
                atom_Zs.append(bond_info["to_Zs"])

                atom_site_indices.append([site_index])
                atom_site_indices.append(bond_info["to_site_index"])

    atoms_to_show = np.vstack(atoms_to_show)
    atom_Zs = np.concatenate(atom_Zs)
    atom_site_indices = np.concatenate(atom_site_indices)

    unique_atoms_to_show, mask = np.unique(
        np.round(atoms_to_show, 6),
        axis=0,
        return_index=True,
    )

    unique_atom_Zs = atom_Zs[mask]
    unique_atom_site_indicies = atom_site_indices[mask]

    atom_key = _get_atom_key(
        structure=structure,
        cart_coords=unique_atoms_to_show,
        site_indices=unique_atom_site_indicies,
    )

    return (
        unique_atoms_to_show,
        unique_atom_Zs,
        atom_key,
    )


def _get_atom_key(
    structure: Structure, cart_coords: np.ndarray, site_indices: np.ndarray
) -> tp.List[tp.Tuple[int, int, int, int]]:
    lattice = structure.lattice
    frac_coords = cart_coords.dot(lattice.inv_matrix)
    mod_frac_coords = np.mod(np.round(frac_coords, 6), 1.0)
    image = np.round(frac_coords - mod_frac_coords).astype(int)
    key_array = np.c_[site_indices, image]
    keys = list(map(tuple, key_array))

    return keys


def _get_unit_cell(
    unit_cell: np.ndarray,
) -> tp.List:
    frac_points = np.array(
        [
            [0, 0, 0],
            [1, 0, 0],
            [1, 1, 0],
            [0, 1, 0],
            [0, 0, 0],
            [0, 0, 1],
            [1, 0, 1],
            [1, 0, 0],
            [1, 0, 1],
            [1, 1, 1],
            [1, 1, 0],
            [1, 1, 1],
            [0, 1, 1],
            [0, 1, 0],
            [0, 1, 1],
            [0, 0, 1],
        ]
    )
    points = frac_points.dot(unit_cell)

    return [_three_flip(p) for p in points.tolist()]


# def _get_atom(
#     position: np.ndarray,
#     atomic_number: int,
# ) -> pv.Sphere:
#     radius = Element(chemical_symbols[atomic_number]).atomic_radius / 2
#     sphere = pv.Sphere(
#         radius=radius,
#         center=position,
#         theta_resolution=20,
#         phi_resolution=20,
#     )

#     return sphere


# def _get_bond(
#     position: np.ndarray,
#     bond: np.ndarray,
#     atomic_number: int,
# ) -> pv.Cylinder:
#     bond_center = position + (0.25 * bond)
#     bond_length = np.linalg.norm(bond)
#     norm_bond = bond / bond_length

#     cylinder = pv.Cylinder(
#         center=bond_center,
#         direction=norm_bond,
#         radius=0.1,
#         height=0.5 * bond_length,
#         resolution=20,
#     )

#     return cylinder


def _get_radius(Z: int, scale: float = 0.5):
    return float(scale * Element(chemical_symbols[Z]).atomic_radius)


def _three_flip(xyz):
    x, y, z = xyz
    return [x, z, -y]


def _get_threejs_data_old(data_dict):
    structure = Structure.from_dict(data_dict)
    structure.add_site_property("base_index", list(range(len(structure))))
    center_shift = structure.lattice.get_cartesian_coords([0.5, 0.5, 0.5])

    bond_dict = _get_bond_info(
        structure=structure,
        bond_dict_site_property="base_index",
    )

    atom_positions, atomic_numbers, atom_keys = _get_plotting_information(
        structure=structure,
        bond_dict=bond_dict,
        bond_dict_site_propery="base_index",
    )
    bond_list = []
    atom_list = [
        {
            "position": _three_flip(p.tolist()),
            "radius": _get_radius(Z),
            "color": to_hex(vesta_colors[Z]),
        }
        for p, Z in zip(atom_positions, atomic_numbers)
    ]

    for i in range(len(atom_positions)):
        position = atom_positions[i]
        Z = atomic_numbers[i]
        atom_key = atom_keys[i]
        color = to_hex(vesta_colors[Z])

        bond_vectors = bond_dict[atom_key[0]]["bond_vectors"]
        to_site_index = bond_dict[atom_key[0]]["to_site_index"]
        to_Zs = bond_dict[atom_key[0]]["to_Zs"]
        end_positions = bond_vectors + position
        from_radius = _get_radius(Z)

        bond_keys = _get_atom_key(
            structure=structure,
            cart_coords=end_positions,
            site_indices=to_site_index,
        )

        for j, bond_key in enumerate(bond_keys):
            if bond_key in atom_keys:
                to_radius = _get_radius(to_Zs[j])
                norm_vec = bond_vectors[j] / np.linalg.norm(bond_vectors[j])
                from_atom_edge = position + (from_radius * norm_vec)
                to_atom_edge = end_positions[j] - (to_radius * norm_vec)

                center_position = 0.5 * (from_atom_edge + to_atom_edge)
                bond_data = {
                    "toPosition": _three_flip(center_position.tolist()),
                    "fromPosition": _three_flip(position.tolist()),
                    "color": to_hex(color),
                }
                bond_list.append(bond_data)

    basis_vecs = copy.deepcopy(structure.lattice.matrix)
    norm_basis_vecs = basis_vecs / np.linalg.norm(basis_vecs, axis=1)
    basis = [_three_flip(v) for v in norm_basis_vecs.tolist()]
    a, b, c = basis
    ab_cross = np.cross(a, b)
    ac_cross = -np.cross(a, c)
    bc_cross = np.cross(b, c)

    view_info = {
        "a": {
            "lookAt": a,
            "up": (ab_cross / np.linalg.norm(ab_cross)).tolist(),
        },
        "b": {
            "lookAt": b,
            "up": (ab_cross / np.linalg.norm(ab_cross)).tolist(),
        },
        "c": {
            "lookAt": c,
            "up": (ac_cross / np.linalg.norm(ac_cross)).tolist(),
        },
        "a*": {
            "lookAt": bc_cross.tolist(),
            "up": (ab_cross / np.linalg.norm(ab_cross)).tolist(),
        },
        "b*": {
            "lookAt": ac_cross.tolist(),
            "up": (ab_cross / np.linalg.norm(ab_cross)).tolist(),
        },
        "c*": {
            "lookAt": ab_cross.tolist(),
            "up": (ac_cross / np.linalg.norm(ac_cross)).tolist(),
        },
    }

    return {
        "atoms": atom_list,
        "bonds": bond_list,
        "unitCell": [{"points": _get_unit_cell(structure.lattice.matrix)}],
        "basis": basis,
        "viewData": view_info,
        "centerShift": _three_flip((-1 * center_shift).tolist()),
    }


def _get_threejs_data(
    structure: Structure,
    charge_dict: tp.Optional[tp.Dict[str, float]] = None,
):
    # if charge_dict is None:
    #     oxi_guess = structure.composition.oxi_state_guesses()
    #     oxi_guess = oxi_guess or [{e.symbol: 0 for e in structure.composition}]
    #     oxi_guess = oxi_guess[0]
    # else:
    #     oxi_guess = charge_dict

    unique_zs = np.unique(structure.atomic_numbers)
    color_dict = {
        chemical_symbols[z]: to_hex(vesta_colors[z]) for z in unique_zs
    }
    z_combos = list(itertools.combinations_with_replacement(unique_zs, 2))

    # r_vdw = np.array([vdw_radii[z] for z in unique_zs])
    # r_covalent = np.array([covalent_radii[z] for z in unique_zs])

    default_radius_dict = {}

    for z1, z2 in z_combos:
        # r_covalent = covalent_radii[z1] + covalent_radii[z2]

        s1 = chemical_symbols[z1]
        s2 = chemical_symbols[z2]

        # charge1 = oxi_guess[s1]
        # charge2 = oxi_guess[s2]

        # sign = np.sign(charge1 * charge2)

        key = f"{s1}-{s2}"

        # if sign <= 0:
        #     r_default = 1.4 * r_covalent
        # else:
        #     r_default = 0.0

        if len(z_combos) > 1 and z1 != z2:
            r_covalent = covalent_radii[z1] + covalent_radii[z2]
            r_default = 1.4 * r_covalent
        else:
            r_default = 0.0

        default_radius_dict[key] = float(r_default)

    graph_data = _get_neighbor_graph(
        structure=structure,
    )
    center_shift = structure.lattice.get_cartesian_coords([0.5, 0.5, 0.5])

    basis_vecs = copy.deepcopy(structure.lattice.matrix)
    norm_basis_vecs = basis_vecs / np.linalg.norm(basis_vecs, axis=1)
    basis = [_three_flip(v) for v in norm_basis_vecs.tolist()]
    a, b, c = basis
    ab_cross = np.cross(a, b)
    ac_cross = -np.cross(a, c)
    bc_cross = np.cross(b, c)

    view_info = {
        "a": {
            "lookAt": a,
            "up": (ab_cross / np.linalg.norm(ab_cross)).tolist(),
        },
        "b": {
            "lookAt": b,
            "up": (ab_cross / np.linalg.norm(ab_cross)).tolist(),
        },
        "c": {
            "lookAt": c,
            "up": (ac_cross / np.linalg.norm(ac_cross)).tolist(),
        },
        "a*": {
            "lookAt": bc_cross.tolist(),
            "up": (ab_cross / np.linalg.norm(ab_cross)).tolist(),
        },
        "b*": {
            "lookAt": ac_cross.tolist(),
            "up": (ab_cross / np.linalg.norm(ab_cross)).tolist(),
        },
        "c*": {
            "lookAt": ab_cross.tolist(),
            "up": (ac_cross / np.linalg.norm(ac_cross)).tolist(),
        },
    }

    return {
        "graphData": graph_data,
        "bondCutoffs": default_radius_dict,
        "speciesPairs": list(default_radius_dict.keys()),
        "speciesColors": color_dict,
        "unitCell": {"points": _get_unit_cell(structure.lattice.matrix)},
        "basis": basis,
        "viewData": view_info,
        "centerShift": _three_flip((-1 * center_shift).tolist()),
    }


def _single_miller_scan(
    substrate: Structure,
    film: Structure,
    substrate_index: tp.List[int],
    film_index: tp.List[int],
    max_area: tp.Optional[float],
    max_strain: float,
) -> None:
    sub_obs = OrientedBulk(
        bulk=substrate,
        miller_index=substrate_index,
        make_planar=True,
    )
    sub_inplane_vectors = sub_obs.inplane_vectors
    sub_basis = sub_obs.crystallographic_basis
    sub_area = sub_obs.area

    film_obs = OrientedBulk(
        bulk=film,
        miller_index=film_index,
        make_planar=True,
    )
    film_inplane_vectors = film_obs.inplane_vectors
    film_basis = film_obs.crystallographic_basis
    film_area = film_obs.area

    zm = ZurMcGill(
        film_vectors=film_inplane_vectors,
        substrate_vectors=sub_inplane_vectors,
        film_basis=film_basis,
        substrate_basis=sub_basis,
        max_area=max_area,
        max_strain=max_strain,
        max_area_mismatch=None,
        max_area_scale_factor=4.1,
    )
    matches = zm.run()

    if len(matches) > 0:
        best_match = matches[0]
        stream = io.BytesIO()
        plot_match(match=best_match, output=stream, dpi=100)
        base64_stream = base64.b64encode(stream.getvalue()).decode()
        stream.close()
        sub_miller_str = "".join(
            [str(i) for i in substrate_index.astype(int).tolist()]
        )
        film_miller_str = "".join(
            [str(i) for i in film_index.astype(int).tolist()]
        )
        formatted_sub_miller = _get_formatted_miller_index(sub_miller_str)
        formatted_film_miller = _get_formatted_miller_index(film_miller_str)

        match_data = {
            "filmMillerIndex": formatted_film_miller,
            "substrateMillerIndex": formatted_sub_miller,
            "matchArea": round(float(best_match.area), 3),
            "matchRelativeArea": round(
                float(best_match.area / np.sqrt(sub_area * film_area)),
                3,
            ),
            "matchStrain": round(float(100 * best_match.strain), 3),
            "matchPlot": base64_stream,
        }

        return match_data
    else:
        return {}


def _run_miller_scan_parallel(
    film_bulk,
    substrate_bulk,
    max_film_miller_index: int,
    max_substrate_miller_index: int,
    max_area: float,
    max_strain: float,
) -> tp.List[tp.Dict[str, tp.Union[tp.List[int], float]]]:
    film_structure = Structure.from_dict(film_bulk)
    substrate_structure = Structure.from_dict(substrate_bulk)

    ms = MillerSearch(
        substrate=substrate_structure,
        film=film_structure,
        max_film_index=max_film_miller_index,
        max_substrate_index=max_substrate_miller_index,
        max_strain=max_strain,
        max_area=max_area,
        refine_structure=False,
        suppress_warnings=True,
    )
    ms.run_scan()
    stream = io.BytesIO()
    ms.plot_misfits(
        fontsize=16,
        dpi=150,
        output=stream,
    )
    base64_stream = base64.b64encode(stream.getvalue()).decode()
    stream.close()

    film_miller_indices = ogre_utils.get_unique_miller_indices(
        structure=film_structure,
        max_index=max_film_miller_index,
    )

    substrate_miller_indices = ogre_utils.get_unique_miller_indices(
        structure=substrate_structure,
        max_index=max_substrate_miller_index,
    )

    N = len(film_miller_indices)
    M = len(substrate_miller_indices)

    aspect_ratio = f"{5 * M}/{N * 4}"

    match_list = []
    inds = itertools.product(substrate_miller_indices, film_miller_indices)
    par_sub_inds, par_film_inds = list(zip(*inds))
    inputs = zip(
        itertools.repeat(substrate_structure),
        itertools.repeat(film_structure),
        par_sub_inds,
        par_film_inds,
        itertools.repeat(max_area),
        itertools.repeat(max_strain),
    )

    with Pool(processes=cpu_count()) as p:
        matches = p.starmap(_single_miller_scan, inputs)

    for match in matches:
        if len(match) > 0:
            match_list.append(match)

    if len(match_list) > 1:
        match_list.sort(key=lambda x: (x["matchStrain"], x["matchArea"]))

    return base64_stream, aspect_ratio, match_list


def _run_miller_scan(
    film_bulk,
    substrate_bulk,
    max_film_miller_index: int,
    max_substrate_miller_index: int,
    max_area: float,
    max_strain: float,
) -> tp.List[tp.Dict[str, tp.Union[tp.List[int], float]]]:
    film_structure = Structure.from_dict(film_bulk)
    substrate_structure = Structure.from_dict(substrate_bulk)

    film_miller_indices = ogre_utils.get_unique_miller_indices(
        structure=film_structure,
        max_index=max_film_miller_index,
    )

    substrate_miller_indices = ogre_utils.get_unique_miller_indices(
        structure=substrate_structure,
        max_index=max_substrate_miller_index,
    )

    match_list = []

    for i, sub_ind in enumerate(substrate_miller_indices):
        for j, film_ind in enumerate(film_miller_indices):
            print(sub_ind, film_ind)
            sub_obs = OrientedBulk(
                bulk=substrate_structure,
                miller_index=sub_ind,
                make_planar=True,
            )
            sub_inplane_vectors = sub_obs.inplane_vectors
            sub_basis = sub_obs.crystallographic_basis
            sub_area = sub_obs.area

            film_obs = OrientedBulk(
                bulk=film_structure,
                miller_index=film_ind,
                make_planar=True,
            )
            film_inplane_vectors = film_obs.inplane_vectors
            film_basis = film_obs.crystallographic_basis
            film_area = film_obs.area

            zm = ZurMcGill(
                film_vectors=film_inplane_vectors,
                substrate_vectors=sub_inplane_vectors,
                film_basis=film_basis,
                substrate_basis=sub_basis,
                max_area=max_area,
                max_strain=max_strain,
                max_area_mismatch=None,
                max_area_scale_factor=4.1,
            )
            matches = zm.run()

            if len(matches) > 0:
                best_match = matches[0]
                stream = io.BytesIO()
                plot_match(match=best_match, output=stream)
                base64_stream = base64.b64encode(stream.getvalue()).decode()
                stream.close()
                print(
                    len(base64_stream), base64_stream[:20], base64_stream[-20:]
                )
                sub_miller_str = "".join(
                    [str(i) for i in sub_ind.astype(int).tolist()]
                )
                film_miller_str = "".join(
                    [str(i) for i in film_ind.astype(int).tolist()]
                )
                formatted_sub_miller = _get_formatted_miller_index(
                    sub_miller_str
                )
                formatted_film_miller = _get_formatted_miller_index(
                    film_miller_str
                )

                match_data = {
                    "filmMillerIndex": formatted_film_miller,
                    "substrateMillerIndex": formatted_sub_miller,
                    "matchArea": round(
                        float(best_match.area / np.sqrt(sub_area * film_area)),
                        3,
                    ),
                    "matchStrain": round(float(best_match.strain), 3),
                    "matchPlot": base64_stream,
                }
                match_list.append(match_data)

    if len(match_list) > 1:
        match_list.sort(key=lambda x: (x["matchStrain"], x["matchArea"]))

    return match_list


def _get_film_and_substrate_inds(
    film_generator: SurfaceGenerator,
    substrate_generator: SurfaceGenerator,
    filter_on_charge: bool = True,
    use_most_stable_substrate: bool = True,
) -> tp.List[tp.Tuple[int, int]]:
    film_and_substrate_inds = []

    if use_most_stable_substrate:
        substrate_inds_to_use = _get_most_stable_surface(
            surface_generator=substrate_generator
        )
    else:
        substrate_inds_to_use = np.arange(len(substrate_generator)).astype(int)

    for i, film in enumerate(film_generator):
        for j, sub in enumerate(substrate_generator):
            if j in substrate_inds_to_use:
                if filter_on_charge:
                    sub_sign = np.sign(sub.top_surface_charge)
                    film_sign = np.sign(film.bottom_surface_charge)

                    if sub_sign == 0.0 or film_sign == 0.0:
                        film_and_substrate_inds.append((i, j))
                    else:
                        if np.sign(sub_sign * film_sign) < 0.0:
                            film_and_substrate_inds.append((i, j))
                else:
                    film_and_substrate_inds.append((i, j))

    return film_and_substrate_inds


def _get_most_stable_surface(
    surface_generator: SurfaceGenerator,
) -> tp.List[int]:
    surface_energies = []
    for surface in surface_generator:
        surfE_calculator = IonicSurfaceEnergy(
            surface=surface,
            auto_determine_born_n=False,
            born_n=12.0,
        )
        surface_energies.append(surfE_calculator.get_cleavage_energy())

    surface_energies = np.round(np.array(surface_energies), 6)
    min_surface_energy = surface_energies.min()

    most_stable_indices = np.where(surface_energies == min_surface_energy)

    return most_stable_indices[0].astype(int).tolist()


def _get_optimize_inputs(
    film_bulk,
    substrate_bulk,
    film_miller_index: tp.List[int],
    substrate_miller_index: tp.List[int],
    use_most_stable_substrate: bool,
) -> tp.List[tp.Dict[str, tp.Union[tp.List[int], float]]]:
    film_structure = Structure.from_dict(film_bulk)
    substrate_structure = Structure.from_dict(substrate_bulk)

    films = SurfaceGenerator(
        bulk=film_structure,
        miller_index=film_miller_index,
        minimum_thickness=10.0,
        refine_structure=False,
    )

    substrates = SurfaceGenerator(
        bulk=substrate_structure,
        miller_index=substrate_miller_index,
        minimum_thickness=10.0,
        refine_structure=False,
    )

    film_sub_inds = _get_film_and_substrate_inds(
        film_generator=films,
        substrate_generator=substrates,
        filter_on_charge=True,
        use_most_stable_substrate=use_most_stable_substrate,
    )

    return_data = [
        {"film": film_ind, "substrate": sub_ind}
        for (film_ind, sub_ind) in film_sub_inds
    ]

    return return_data


def _shrink_slab_cell(
    structure: Structure,
    pad=5.0,
) -> Structure:
    z_frac = structure.frac_coords[:, -1]
    z_min = z_frac.min()
    structure.translate_sites(
        indices=range(len(structure)),
        vector=np.array([0, 0, -z_min]),
        frac_coords=True,
        to_unit_cell=True,
    )

    rounded_struc = ogre_utils.get_rounded_structure(
        structure=structure,
        tol=6,
    )
    z_cart = rounded_struc.cart_coords[:, -1]
    max_z = z_cart.max()

    matrix = copy.deepcopy(rounded_struc.lattice.matrix)
    matrix[-1, -1] = max_z + (2 * pad)

    shrunk_struc = Structure(
        lattice=Lattice(
            matrix=matrix,
            pbc=(True, True, False),
        ),
        species=rounded_struc.species,
        coords=rounded_struc.cart_coords,
        coords_are_cartesian=True,
        to_unit_cell=True,
    )

    shrunk_struc.translate_sites(
        indices=range(len(shrunk_struc)),
        vector=np.array([0, 0, pad]),
        frac_coords=False,
        to_unit_cell=True,
    )

    return shrunk_struc


def _optimize_interface_all(
    film_bulk,
    substrate_bulk,
    film_miller_index: tp.List[int],
    substrate_miller_index: tp.List[int],
    use_most_stable_substrate: bool,
    max_area: float,
    max_strain: float,
) -> tp.List[tp.Dict[str, tp.Union[tp.List[int], float]]]:
    film_structure = Structure.from_dict(film_bulk)
    substrate_structure = Structure.from_dict(substrate_bulk)

    iface_search = IonicInterfaceSearch(
        substrate_bulk=substrate_structure,
        film_bulk=film_structure,
        substrate_miller_index=substrate_miller_index,
        film_miller_index=film_miller_index,
        minimum_slab_thickness=10.0,
        vacuum=13.0,
        max_strain=max_strain,
        max_area=max_area,
        n_particles_PSO=15,
        max_iterations_PSO=75,
        app_mode=True,
        dpi=100,
        verbose=False,
        use_most_stable_substrate=use_most_stable_substrate,
    )

    return_data = iface_search.run_interface_search(filter_on_charge=True)

    return return_data


def _optimize_interface(
    film_bulk,
    substrate_bulk,
    film_miller_index: tp.List[int],
    substrate_miller_index: tp.List[int],
    film_index: int,
    substrate_index: int,
    max_area: float,
    max_strain: float,
) -> tp.List[tp.Dict[str, tp.Union[tp.List[int], float]]]:
    film_structure = Structure.from_dict(film_bulk)
    substrate_structure = Structure.from_dict(substrate_bulk)

    films = SurfaceGenerator(
        bulk=film_structure,
        miller_index=film_miller_index,
        minimum_thickness=10.0,
        refine_structure=False,
    )

    substrates = SurfaceGenerator(
        bulk=substrate_structure,
        miller_index=substrate_miller_index,
        minimum_thickness=10.0,
        refine_structure=False,
    )

    film = films[film_index]
    substrate = substrates[substrate_index]

    interface_generator = InterfaceGenerator(
        substrate=substrate,
        film=film,
        max_strain=max_strain,
        max_area=max_area,
        interfacial_distance=2.0,
        center=True,
    )

    interfaces = interface_generator.generate_interfaces()
    interface = interfaces[0]

    surface_matcher = IonicSurfaceMatcher(
        interface=interface,
        auto_determine_born_n=False,
        born_n=12.0,
    )

    surface_matcher.optimizePSO(
        max_iters=100,
        n_particles=15,
    )

    surface_matcher.get_optimized_structure()

    iface = interface.get_interface(orthogonal=True)

    inds_to_keep = []

    for i in range(2):
        sub_inds = interface.get_substrate_layer_indices(
            layer_from_interface=i,
            atomic_layers=True,
        )
        film_inds = interface.get_film_layer_indices(
            layer_from_interface=i,
            atomic_layers=True,
        )

        inds_to_keep.append(sub_inds)
        inds_to_keep.append(film_inds)

    inds_to_keep = np.concatenate(inds_to_keep)
    all_inds = np.ones(len(iface)).astype(bool)
    all_inds[inds_to_keep] = False

    inds_to_delete = np.where(all_inds)[0]

    small_iface = iface.copy()
    small_iface.remove_sites(inds_to_delete)

    shrunk_iface = _shrink_slab_cell(
        structure=iface,
        pad=5.0,
    )
    shrunk_small_iface = _shrink_slab_cell(
        structure=small_iface,
        pad=5.0,
    )

    return shrunk_iface.to_json(), shrunk_small_iface.to_json()


"""
--------------------------- REST CALLS -----------------------------
"""


# Remove and replace with your own
@app.route("/example")
# @cross_origin(supports_credentials=False)
def example():
    # See /src/components/App.js for frontend call
    return jsonify(
        "Example response from Flask! Learn more in /app.py & /src/components/App.js"
    )


@app.route("/api/structure_upload", methods=["POST"])
@cross_origin(supports_credentials=False)
def substrate_file_upload():
    film_file = request.files["filmFile"]
    substrate_file = request.files["substrateFile"]
    film_file.headers.add("Access-Control-Allow-Origin", "*")
    substrate_file.headers.add("Access-Control-Allow-Origin", "*")

    with film_file.stream as film_f:
        film_file_contents = film_f.read().decode()

    with substrate_file.stream as substrate_f:
        substrate_file_contents = substrate_f.read().decode()

    film_struc = Structure.from_str(film_file_contents, fmt="cif")
    film_formula = film_struc.composition.reduced_formula
    film_formula_comp = _get_formatted_formula(film_formula)
    film_sg = SpacegroupAnalyzer(structure=film_struc)
    film_sg_symbol = film_sg.get_space_group_symbol()
    film_sg_comp = _get_formatted_spacegroup(film_sg_symbol)
    film_label = (
        [["span", {}, "Film: "]]
        + film_formula_comp
        + [["span", {}, " ("]]
        + film_sg_comp
        + [["span", {}, ")"]]
    )

    substrate_struc = Structure.from_str(substrate_file_contents, fmt="cif")
    substrate_formula = substrate_struc.composition.reduced_formula
    substrate_formula_comp = _get_formatted_formula(substrate_formula)
    substrate_sg = SpacegroupAnalyzer(structure=substrate_struc)
    substrate_sg_symbol = substrate_sg.get_space_group_symbol()
    substrate_sg_comp = _get_formatted_spacegroup(substrate_sg_symbol)
    substrate_label = (
        [["span", {}, "Substrate: "]]
        + substrate_formula_comp
        + [["span", {}, " ("]]
        + substrate_sg_comp
        + [["span", {}, ")"]]
    )

    return jsonify(
        {
            "film": film_struc.to_json(),
            "filmSpaceGroup": film_sg_symbol,
            "filmLabel": film_label,
            "substrate": substrate_struc.to_json(),
            "substrateLabel": substrate_label,
        }
    )


@app.route("/api/structure_to_three", methods=["POST"])
@cross_origin()
def convert_structure_to_three():
    json_data = request.data.decode()
    data_dict = json.loads(json_data)
    # print(data_dict)

    if len(data_dict.keys()) == 0:
        return jsonify({"atoms": [], "bonds": [], "basis": []})
    else:
        structure = Structure.from_dict(data_dict)
        s = time.time()
        plotting_data = _get_threejs_data(structure=structure)
        print(f"Time to get structure: {time.time() - s:.4f}")

        return jsonify(plotting_data)


@app.route("/api/get_optimize_inputs", methods=["POST"])
@cross_origin()
def get_optimize_inputs():
    data = request.form

    film_miller_type = data["filmMillerType"]
    substrate_miller_type = data["substrateMillerType"]
    use_most_stable_substrate = "stableSubstrate" in data

    miller_keys = {
        "cubic": ["H", "K", "L"],
        "hexagonal": ["H", "K", "I", "L"],
    }

    film_miller_index = []
    substrate_miller_index = []

    for key in miller_keys[film_miller_type]:
        val = int(data[f"film{key}"].strip())
        film_miller_index.append(val)

    for key in miller_keys[substrate_miller_type]:
        val = int(data[f"substrate{key}"].strip())
        substrate_miller_index.append(val)

    substrate_structure_dict = json.loads(data["substrateStructure"])
    film_structure_dict = json.loads(data["filmStructure"])

    film_sub_inds = _get_optimize_inputs(
        film_bulk=film_structure_dict,
        substrate_bulk=substrate_structure_dict,
        film_miller_index=film_miller_index,
        substrate_miller_index=substrate_miller_index,
        use_most_stable_substrate=use_most_stable_substrate,
    )

    return_data = {
        "maxArea": data["maxArea"],
        "maxStrain": data["maxStrain"],
        "substrateMillerIndex": substrate_miller_index,
        "filmMillerIndex": film_miller_index,
        "terminationInds": film_sub_inds,
    }

    return jsonify(return_data)


@app.route("/api/optimize_interface", methods=["POST"])
@cross_origin()
def optimize_interface():
    data = request.form

    substrate_structure_dict = json.loads(data["substrateStructure"])
    film_structure_dict = json.loads(data["filmStructure"])

    use_most_stable_substrate = "stableSubstrate" in data

    _max_area = data["maxArea"]

    if _max_area == "":
        max_area = None
    else:
        max_area = float(_max_area.strip())

    max_strain = float(data["maxStrain"].strip()) / 100

    film_miller_type = data["filmMillerType"]
    substrate_miller_type = data["substrateMillerType"]

    miller_keys = {
        "cubic": ["H", "K", "L"],
        "hexagonal": ["H", "K", "I", "L"],
    }

    film_miller_index = []
    substrate_miller_index = []

    for key in miller_keys[film_miller_type]:
        val = int(data[f"film{key}"].strip())
        film_miller_index.append(val)

    for key in miller_keys[substrate_miller_type]:
        val = int(data[f"substrate{key}"].strip())
        substrate_miller_index.append(val)

    # film_miller_index = []
    # for i in data["filmMillerIndex"].split(","):
    #     film_miller_index.append(int(i))

    # substrate_miller_index = []
    # for i in data["substrateMillerIndex"].split(","):
    #     substrate_miller_index.append(int(i))

    return_data = _optimize_interface_all(
        substrate_bulk=substrate_structure_dict,
        film_bulk=film_structure_dict,
        substrate_miller_index=substrate_miller_index,
        film_miller_index=film_miller_index,
        use_most_stable_substrate=use_most_stable_substrate,
        max_area=max_area,
        max_strain=max_strain,
    )

    return jsonify(return_data)


# @app.route("/api/optimize_interface", methods=["POST"])
# @cross_origin()
def optimize_interface_old():
    data = request.form

    substrate_structure_dict = json.loads(data["substrateStructure"])
    film_structure_dict = json.loads(data["filmStructure"])

    substrate_index = int(data["substrateTerminationInd"])
    film_index = int(data["filmTerminationInd"])

    use_most_stable_substrate = "stableSubstrate" in data

    _max_area = data["maxArea"]

    if _max_area == "":
        max_area = None
    else:
        max_area = float(_max_area.strip())

    max_strain = float(data["maxStrain"].strip()) / 100

    film_miller_index = []
    for i in data["filmMillerIndex"].split(","):
        film_miller_index.append(int(i))

    substrate_miller_index = []
    for i in data["substrateMillerIndex"].split(","):
        substrate_miller_index.append(int(i))

    top_view_data, side_view_data = _optimize_interface(
        film_bulk=film_structure_dict,
        substrate_bulk=substrate_structure_dict,
        film_miller_index=film_miller_index,
        substrate_miller_index=substrate_miller_index,
        film_index=film_index,
        substrate_index=substrate_index,
        max_area=max_area,
        max_strain=max_strain,
    )

    return_data = {
        "topViewStructure": top_view_data,
        "sideViewStructure": side_view_data,
    }

    return jsonify(return_data)


@app.route("/api/test_search", methods=["POST"])
@cross_origin()
def test_search():
    for i in range(500):
        time.sleep(0.01)

    return {"result": "Finished!!"}


@app.route("/api/miller_scan", methods=["POST"])
@cross_origin()
def miller_scan():
    data = request.form
    max_film_miller = int(data["maxFilmMiller"].strip())
    max_substrate_miller = int(data["maxSubstrateMiller"].strip())
    _max_area = data["maxArea"]

    if _max_area == "":
        max_area = None
    else:
        max_area = float(_max_area.strip())

    max_strain = float(data["maxStrain"].strip()) / 100
    substrate_structure_dict = json.loads(data["substrateStructure"])
    film_structure_dict = json.loads(data["filmStructure"])

    s = time.time()
    (
        total_plot_img_data,
        total_plot_aspect_ratio,
        match_list,
    ) = _run_miller_scan_parallel(
        film_bulk=film_structure_dict,
        substrate_bulk=substrate_structure_dict,
        max_film_miller_index=max_film_miller,
        max_substrate_miller_index=max_substrate_miller,
        max_area=max_area,
        max_strain=max_strain,
    )
    print("TOTAL TIME =", time.time() - s)

    return jsonify(
        {
            "matchList": match_list,
            "totalImgData": total_plot_img_data,
            "totalImgAspectRatio": total_plot_aspect_ratio,
            "maxFilmIndex": data["maxFilmMiller"],
            "maxSubstrateIndex": data["maxSubstrateMiller"],
            "maxArea": data["maxArea"],
            "maxStrain": data["maxStrain"],
        }
    )


"""
-------------------------- APP SERVICES ----------------------------
"""


# Quits Flask on Electron exit
@app.route("/quit")
def quit():
    shutdown = request.environ.get("werkzeug.server.shutdown")
    print("SHUTTING DOWN")
    shutdown()

    return


if __name__ == "__main__":
    if sys.platform.startswith("win"):
        # On Windows calling this function is necessary.
        freeze_support()

    app.run(**app_config)
