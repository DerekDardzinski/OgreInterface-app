import sys
import typing as tp
import itertools
import copy
import json

from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin

from pymatgen.core.structure import Structure
from pymatgen.core.lattice import Lattice
from pymatgen.core.periodic_table import Element
from pymatgen.analysis.local_env import CrystalNN
from pymatgen.symmetry.analyzer import SpacegroupAnalyzer
from ase.data import chemical_symbols
from matplotlib.colors import to_hex
import numpy as np
# import pyvista as pv

from OgreInterface.plotting_tools.colors import vesta_colors
from OgreInterface.miller import MillerSearch
from OgreInterface import utils as ogre_utils

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
            data = ["span", {"className": "overline"}, spacegroup[i + 1]]
            formatted_spacegroup.append(data)
            i += 2
        else:
            data = ["span", {}, spacegroup[i]]
            formatted_spacegroup.append(data)
            i += 1

    return formatted_spacegroup


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


def _get_threejs_data(data_dict):
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
                    "color": color,
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


def _run_miller_scan(
    film_bulk,
    substrate_bulk,
    max_film_miller_index: int,
    max_substrate_miller_index: int,
    max_area: float,
    max_strain: float,
) -> tp.Dict:
    film_structure = Structure.from_dict(film_bulk)
    substrate_structure = Structure.from_dict(substrate_bulk)

    print(film_structure)
    print(substrate_structure)

"""
--------------------------- REST CALLS -----------------------------
"""
# Remove and replace with your own
@app.route("/example")
# @cross_origin(supports_credentials=False)
def example():

  # See /src/components/App.js for frontend call
  return jsonify("Example response from Flask! Learn more in /app.py & /src/components/App.js")


@app.route("/api/structure_upload", methods=["POST"])
@cross_origin(supports_credentials=False)
def substrate_file_upload():
    print(request.files)
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

    if len(data_dict.keys()) == 0:
        return jsonify({"atoms": [], "bonds": [], "basis": []})
    else:
        plotting_data = _get_threejs_data(data_dict=data_dict)

        return jsonify(plotting_data)


@app.route("/api/miller_scan", methods=["POST"])
@cross_origin()
def miller_scan():
    data = request.form
    max_film_miller = data["maxFilmMiller"]
    max_substrate_miller = data["maxSubstrateMiller"]
    _max_area = data["maxArea"]

    if _max_area == "":
        max_area = None
    else:
        max_area = float(max_area.strip())

    max_strain = data["maxStrain"]
    substrate_structure_dict = json.loads(data["substrateStructure"])
    film_structure_dict = json.loads(data["filmStructure"])

    _run_miller_scan(
        film_bulk=film_structure_dict,
        substrate_bulk=substrate_structure_dict,
        max_film_miller_index=int(max_film_miller.strip()),
        max_substrate_miller_index=int(max_substrate_miller.strip()),
        max_area=max_area,
        max_strain=float(max_strain.strip()),
    )

    return jsonify({"test": "test"})




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
  import time
  app.run(**app_config)
