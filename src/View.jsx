import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { STLLoader } from 'three-stdlib';
import * as THREE from 'three';
import debounce from 'lodash.debounce';
import ReactPannellum from 'react-pannellum';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  keyboardControls: {
    id: '3DBlock.keyboardControls',
    defaultMessage: 'Keyboard Controls',
  },
  rotation: {
    id: '3DBlock.rotation',
    defaultMessage: 'Rotation:',
  },
  rotationInstructions: {
    id: '3DBlock.rotationInstructions',
    defaultMessage: '↑↓←→ - Rotate model',
  },
  pan: {
    id: '3DBlock.pan',
    defaultMessage: 'Pan:',
  },
  panInstructions1: {
    id: '3DBlock.panInstructions1',
    defaultMessage: 'W/A/S/D - Pan view',
  },
  panInstructions2: {
    id: '3DBlock.panInstructions2',
    defaultMessage: 'Shift + Arrow keys - Pan view',
  },
  zoom: {
    id: '3DBlock.zoom',
    defaultMessage: 'Zoom:',
  },
  zoomInstructions1: {
    id: '3DBlock.zoomInstructions1',
    defaultMessage: '+ / - - Zoom in/out',
  },
  zoomInstructions2: {
    id: '3DBlock.zoomInstructions2',
    defaultMessage: 'Page Up/Down - Zoom in/out',
  },
  reset: {
    id: '3DBlock.reset',
    defaultMessage: 'Reset:',
  },
  resetInstructions: {
    id: '3DBlock.resetInstructions',
    defaultMessage: 'R or Home - Reset view',
  },
  help: {
    id: '3DBlock.help',
    defaultMessage: 'Help:',
  },
  helpInstructions: {
    id: '3DBlock.helpInstructions',
    defaultMessage: 'H - Toggle this help',
  },
  focusNote: {
    id: '3DBlock.focusNote',
    defaultMessage:
      'Note: Click the 3D viewer to focus it, then use keyboard controls',
  },
  helpHint: {
    id: '3DBlock.helpHint',
    defaultMessage: 'Press H for keyboard controls help',
  },
});

const KeyboardControls = ({
  controlsRef,
  camera,
  initialPosition,
  initialTarget,
}) => {
  const [keys, setKeys] = useState({});

  useEffect(() => {
    let canvas = null;

    const handleKeyDown = (e) => {
      // Only process if this specific canvas has focus
      if (!canvas || document.activeElement !== canvas) {
        return;
      }

      // Stop propagation immediately for control keys when canvas is focused
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'KeyW',
          'KeyA',
          'KeyS',
          'KeyD',
          'Equal',
          'Minus',
          'PageUp',
          'PageDown',
          'KeyR',
          'Home',
        ].includes(e.code)
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }

      setKeys((prev) => ({ ...prev, [e.code]: true }));
    };

    const handleKeyUp = (e) => {
      if (!canvas || document.activeElement !== canvas) {
        // Always clear keys when canvas loses focus
        setKeys({});
        return;
      }

      if (
        [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'KeyW',
          'KeyA',
          'KeyS',
          'KeyD',
          'Equal',
          'Minus',
          'PageUp',
          'PageDown',
          'KeyR',
          'Home',
        ].includes(e.code)
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }

      setKeys((prev) => ({ ...prev, [e.code]: false }));
    };

    // Wait for canvas to be available and attach listeners directly to it
    const checkCanvas = () => {
      canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.addEventListener('keydown', handleKeyDown);
        canvas.addEventListener('keyup', handleKeyUp);

        // Clear keys when canvas loses focus
        canvas.addEventListener('blur', () => {
          setKeys({});
        });
      } else {
        // Retry if canvas not ready yet
        setTimeout(checkCanvas, 100);
      }
    };

    checkCanvas();

    return () => {
      if (canvas) {
        canvas.removeEventListener('keydown', handleKeyDown);
        canvas.removeEventListener('keyup', handleKeyUp);
      }
    };
  }, []);

  useFrame(() => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;
    const rotationSpeed = 0.02; // Increased from 0.01
    const panSpeed = 1.0; // Increased from 0.5
    const zoomSpeed = 1.0; // Increased from 0.5

    // Rotation with arrow keys - rotate around the target
    if (keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight) {
      const spherical = new THREE.Spherical();
      const offset = new THREE.Vector3();

      offset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(offset);

      if (keys.ArrowUp) spherical.phi -= rotationSpeed;
      if (keys.ArrowDown) spherical.phi += rotationSpeed;
      if (keys.ArrowLeft) spherical.theta -= rotationSpeed;
      if (keys.ArrowRight) spherical.theta += rotationSpeed;

      // Restrict phi to avoid flipping
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
    }

    // Pan with WASD or Shift + Arrow keys
    if (keys.KeyW || (keys.ShiftLeft && keys.ArrowUp)) {
      controls.target.y += panSpeed;
      camera.position.y += panSpeed;
    }
    if (keys.KeyS || (keys.ShiftLeft && keys.ArrowDown)) {
      controls.target.y -= panSpeed;
      camera.position.y -= panSpeed;
    }
    if (keys.KeyA || (keys.ShiftLeft && keys.ArrowLeft)) {
      controls.target.x -= panSpeed;
      camera.position.x -= panSpeed;
    }
    if (keys.KeyD || (keys.ShiftLeft && keys.ArrowRight)) {
      controls.target.x += panSpeed;
      camera.position.x += panSpeed;
    }

    // Zoom with +/- or Page Up/Down
    if (keys.Equal || keys.PageUp) {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      camera.position.addScaledVector(direction, zoomSpeed);
    }
    if (keys.Minus || keys.PageDown) {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      camera.position.addScaledVector(direction, -zoomSpeed);
    }

    // Reset view with R or Home key
    if (keys.KeyR || keys.Home) {
      if (initialPosition && initialTarget) {
        camera.position.copy(initialPosition);
        controls.target.copy(initialTarget);
      }
      setKeys((prev) => ({ ...prev, KeyR: false, Home: false })); // Prevent continuous reset
    }

    controls.update();
  });

  return null;
};

const HelpOverlay = ({ show, onToggle }) => {
  const intl = useIntl();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'KeyH') {
        onToggle();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggle]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '5px',
        fontSize: '14px',
        fontFamily: 'monospace',
        zIndex: 1000,
        maxWidth: '300px',
      }}
    >
      <h3 style={{ margin: '0 0 10px 0' }}>
        {intl.formatMessage(messages.keyboardControls)}
      </h3>
      <div>
        <strong>{intl.formatMessage(messages.rotation)}</strong>
      </div>
      <div>{intl.formatMessage(messages.rotationInstructions)}</div>
      <div>
        <strong>{intl.formatMessage(messages.pan)}</strong>
      </div>
      <div>{intl.formatMessage(messages.panInstructions1)}</div>
      <div>{intl.formatMessage(messages.panInstructions2)}</div>
      <div>
        <strong>{intl.formatMessage(messages.zoom)}</strong>
      </div>
      <div>{intl.formatMessage(messages.zoomInstructions1)}</div>
      <div>{intl.formatMessage(messages.zoomInstructions2)}</div>
      <div>
        <strong>{intl.formatMessage(messages.reset)}</strong>
      </div>
      <div>{intl.formatMessage(messages.resetInstructions)}</div>
      <div>
        <strong>{intl.formatMessage(messages.help)}</strong>
      </div>
      <div>{intl.formatMessage(messages.helpInstructions)}</div>
      <div style={{ marginTop: '10px', fontSize: '12px', opacity: '0.8' }}>
        {intl.formatMessage(messages.focusNote)}
      </div>
    </div>
  );
};

const STLViewer = ({
  fileData,
  onCameraChange,
  savedCameraPosition,
  isEditMode,
}) => {
  const [geometry, setGeometry] = useState(null);
  const { camera, gl } = useThree();
  const geometryRef = useRef(null);
  const controlsRef = useRef(null);
  const [initialPosition, setInitialPosition] = useState(null);
  const [initialTarget, setInitialTarget] = useState(null);

  useEffect(() => {
    if (!fileData || geometryRef.current) return;

    const loader = new STLLoader();
    loader.load(fileData, (loadedGeometry) => {
      loadedGeometry.center();
      loadedGeometry.computeBoundingSphere();
      geometryRef.current = loadedGeometry;
      setGeometry(loadedGeometry);

      const box = new THREE.Box3().setFromObject(
        new THREE.Mesh(loadedGeometry),
      );
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const distance = maxDim / (2 * Math.tan(fov / 2));

      if (!savedCameraPosition) {
        camera.position.set(0, 0, distance * 2);
        camera.near = distance / 10;
        camera.far = distance * 10;
        camera.updateProjectionMatrix();
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        // Store initial position and target for reset functionality
        setInitialPosition(new THREE.Vector3(0, 0, distance * 2));
        setInitialTarget(new THREE.Vector3(0, 0, 0));
      } else {
        const { position, target } = savedCameraPosition;
        camera.position.set(position.x, position.y, position.z);
        camera.lookAt(new THREE.Vector3(target.x, target.y, target.z));

        // Store saved position as initial for reset
        setInitialPosition(
          new THREE.Vector3(position.x, position.y, position.z),
        );
        setInitialTarget(new THREE.Vector3(target.x, target.y, target.z));
      }
    });
  }, [fileData, savedCameraPosition, camera]);

  if (!geometry) return null;

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        args={[camera, gl.domElement]}
        target={new THREE.Vector3(0, 0, 0)}
        enableDamping={true}
        dampingFactor={0.2}
        rotateSpeed={1.2}
        panSpeed={1.2}
        zoomSpeed={1.2}
        onEnd={(e) => {
          if (isEditMode && onCameraChange) {
            const { position } = e.target.object;
            const target = e.target.target;
            onCameraChange({
              position: { x: position.x, y: position.y, z: position.z },
              target: { x: target.x, y: target.y, z: target.z },
            });
          }
        }}
      />
      <KeyboardControls
        controlsRef={controlsRef}
        camera={camera}
        initialPosition={initialPosition}
        initialTarget={initialTarget}
      />
      <mesh geometry={geometry} frustumCulled={false}>
        <meshStandardMaterial attach="material" color={0x808080} />
      </mesh>
    </>
  );
};

const View = (props) => {
  const { file, savedCameraPosition, onCameraChange, isEditMode } = props?.data;
  const [blobUrl, setBlobUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const pannellumRef = useRef(null);
  const intl = useIntl();

  useEffect(() => {
    if (file?.data) {
      setIsLoading(true);
      // Convert base64 to Uint8Array using browser-native methods
      const binaryString = atob(file.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: file['content-type'],
      });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setIsLoading(false);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  const saveCameraPosition = debounce(() => {
    if (pannellumRef.current) {
      const viewer = ReactPannellum.getViewer('panorama');
      if (viewer) {
        const yaw = viewer.getYaw();
        const pitch = viewer.getPitch();
        const hfov = viewer.getHfov();
        if (onCameraChange) onCameraChange({ yaw, pitch, hfov });
      }
    }
  }, 300);

  if (!file || !file.filename || !file.data) {
    return <p>No file provided.</p>;
  }

  const fileExtension = file.filename.split('.').pop().toLowerCase();
  const fileData = `data:${file['content-type']};base64,${file.data}`;

  if (fileExtension === 'stl') {
    return (
      <div className="container360image" style={{ position: 'relative' }}>
        <HelpOverlay
          show={showHelp}
          onToggle={() => setShowHelp((prev) => !prev)}
        />
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            background: 'rgba(0,0,0,0.7)',
            borderRadius: '3px',
            padding: '5px 10px',
            color: 'white',
            fontSize: '12px',
          }}
        >
          {intl.formatMessage(messages.helpHint)}
        </div>
        <Canvas
          camera={{ position: [0, 0, -100], fov: 50 }}
          flat
          max-width={'100%'}
          height="auto"
          linear
          tabIndex={0}
          style={{
            outline: 'none',
            border: 'none',
          }}
          onCreated={({ gl }) => {
            gl.setSize(window.innerWidth, window.innerHeight);
            gl.forceContextRestore();
            gl.domElement.setAttribute(
              'aria-label',
              '3D Model Viewer - Click to focus, then use keyboard controls',
            );
            gl.domElement.setAttribute('role', 'application');
            gl.domElement.tabIndex = 0;
            gl.domElement.style.outline = 'none';
            gl.domElement.style.border = 'none';
          }}
        >
          <Suspense fallback={<p>Loading...</p>}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[1, 1, 1]} intensity={0.7} />
            <STLViewer
              fileData={fileData}
              onCameraChange={onCameraChange}
              savedCameraPosition={savedCameraPosition}
              isEditMode={isEditMode}
            />
          </Suspense>
        </Canvas>
      </div>
    );
  } else if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
    if (isLoading || !blobUrl) {
      return <p>Loading 3D file...</p>;
    }

    return (
      <div className="container360image" onMouseMove={saveCameraPosition}>
        <ReactPannellum
          ref={pannellumRef}
          id="panorama"
          sceneId="firstScene"
          imageSource={blobUrl}
          config={{
            autoLoad: true,
            pitch: savedCameraPosition?.pitch || 10,
            yaw: savedCameraPosition?.yaw || 180,
            hfov: savedCameraPosition?.hfov || 110,
          }}
        />
      </div>
    );
  } else {
    return (
      <p>Unsupported file type. Supported types: .stl, .jpg, .jpeg, .png</p>
    );
  }
};

export default View;
