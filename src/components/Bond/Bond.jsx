import React, {useRef} from 'react'
import { Sphere, Cylinder } from "@react-three/drei"
import * as THREE from "three"

function Bond(props) {
    const ref = useRef()
    let toPosition = new THREE.Vector3().fromArray(props.toPosition)
    let fromPosition = new THREE.Vector3().fromArray(props.fromPosition)
    let bondVector = new THREE.Vector3().subVectors(toPosition, fromPosition)
    let normBondVector = new THREE.Vector3().add(bondVector).divideScalar(bondVector.length())
    let initOrientation = new THREE.Vector3().fromArray([0.0, 1.0, 0.0])
    let bondCenter = new THREE.Vector3().addVectors(toPosition, fromPosition).multiplyScalar(0.5)
    let quat = new THREE.Quaternion().setFromUnitVectors(initOrientation, normBondVector)
    let radius = 0.15

    return (
        <mesh ref={ref}>
        <group position={bondCenter.toArray()}>
        <group quaternion={quat}>
            <Cylinder args={[radius, radius, bondVector.length(), 32, 1]} >
                <meshPhysicalMaterial
                    attach="material"
                    color={props.color}
                    depthWrite={true}
                    side={THREE.DoubleSide}
                    flatShading={false}
                    roughness={0.6}
                    metalness={0.0}
                    reflectivity={0.0}
                    clearcoat={0.0}
                />
            </Cylinder>
        </group>
        </group>     
        </mesh>
    )
}

export default Bond
