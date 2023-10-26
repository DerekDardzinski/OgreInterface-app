import * as React from 'react'
import { useThree, ThreeEvent } from '@react-three/fiber'
import { Hud } from '@react-three/drei'
import { useGizmoContext } from './GizmoHelper'
import { CanvasTexture } from 'three'



function Axis({ scale = [0.8, 0.05, 0.05], color, rotation }) {
  return (
    <group rotation={rotation}>
      <mesh position={[0.4, 0, 0]}>
        <boxGeometry args={scale} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  )
}

function AxisHead({
  onClick,
  font,
  disabled,
  arcStyle,
  label,
  labelColor,
  axisHeadScale = 1,
  ...props
}) {
  const gl = useThree((state) => state.gl)
  const texture = React.useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64

    const context = canvas.getContext('2d')
    context.beginPath()
    context.arc(32, 32, 16, 0, 2 * Math.PI)
    context.closePath()
    context.fillStyle = arcStyle
    context.fill()

    if (label) {
      context.font = font
      context.textAlign = 'center'
      context.fillStyle = labelColor
      context.fillText(label, 32, 41)
    }
    return new CanvasTexture(canvas)
  }, [arcStyle, label, labelColor, font])

  const [active, setActive] = React.useState(false)
  const scale = (label ? 1 : 0.75) * (active ? 1.2 : 1) * axisHeadScale
  const handlePointerOver = (e) => {
    e.stopPropagation()
    setActive(true)
  }
  const handlePointerOut = (e) => {
    e.stopPropagation()
    setActive(false)
  }
  return (
    <sprite
      scale={scale}
      onPointerOver={!disabled ? handlePointerOver : undefined}
      onPointerOut={!disabled ? onClick || handlePointerOut : undefined}
      {...props}
    >
      <spriteMaterial
        map={texture}
        map-anisotropy={gl.capabilities.getMaxAnisotropy() || 1}
        alphaTest={0.3}
        opacity={label ? 1 : 0.75}
        toneMapped={false}
      />
    </sprite>
  )
}

export const BasisVectors = ({
  hideNegativeAxes,
  hideAxisHeads,
  disabled,
  font = '18px Inter var, Arial, sans-serif',
  axisColors = ['#ff2060', '#20df80', '#2080ff'],
  axisHeadScale = 1,
  axisScale,
  labels = ['a', 'b', 'c'],
  labelColor = '#000',
  onClick,
  ...props
}) => {
  const [colorX, colorY, colorZ] = axisColors
  const { tweenCamera } = useGizmoContext()
  const axisHeadProps = {
    font,
    disabled,
    labelColor,
    onClick,
    axisHeadScale,
    onPointerDown: !disabled
      ? (e) => {
          tweenCamera(e.object.position)
          e.stopPropagation()
        }
      : undefined,
  }
  return (
    <group scale={40} {...props}>
      <Axis color={colorX} rotation={[0, 0, 0]} scale={axisScale} />
      <Axis color={colorY} rotation={[0, 0, Math.PI / 2]} scale={axisScale} />
      <Axis color={colorZ} rotation={[0, -Math.PI / 2, 0]} scale={axisScale} />
      {!hideAxisHeads && (
        <>
          <AxisHead arcStyle={colorX} position={[1, 0, 0]} label={labels[0]} {...axisHeadProps} />
          <AxisHead arcStyle={colorY} position={[0, 1, 0]} label={labels[1]} {...axisHeadProps} />
          <AxisHead arcStyle={colorZ} position={[0, 0, 1]} label={labels[2]} {...axisHeadProps} />
          {!hideNegativeAxes && (
            <>
              <AxisHead arcStyle={colorX} position={[-1, 0, 0]} {...axisHeadProps} />
              <AxisHead arcStyle={colorY} position={[0, -1, 0]} {...axisHeadProps} />
              <AxisHead arcStyle={colorZ} position={[0, 0, -1]} {...axisHeadProps} />
            </>
          )}
        </>
      )}
    </group>
  )
}
