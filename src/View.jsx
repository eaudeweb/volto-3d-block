import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import { STLLoader } from 'three-stdlib';
import * as THREE from 'three';
import debounce from 'lodash.debounce';
import ReactPannellum from 'react-pannellum';
import { OrbitControls } from '@react-three/drei';
const KeyboardControls = ({ controlsRef, camera, initialPosition, initialTarget, rotationSpeed = 0.01, panSpeed = 0.5, zoomSpeed = 0.5 }) => {
  const [keys, setKeys] = useState({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Controls only work when canvas has focus
      const canvas = document.querySelector('canvas');
      const container = document.querySelector('.container360image');
      const activeElement = document.activeElement;
      
      if (!canvas || (!canvas.contains(activeElement) && activeElement !== canvas && 
          (!container || !container.contains(activeElement)))) {
        return;
      }
      
      setKeys(prev => ({ ...prev, [e.code]: true }));
      
      // Prevent default browser behavior for navigation keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Equal', 'Minus', 'PageUp', 'PageDown', 'KeyR', 'Home'].includes(e.code)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      setKeys(prev => ({ ...prev, [e.code]: false }));
    };

    // Set up event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame(() => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;

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
      setKeys(prev => ({ ...prev, KeyR: false, Home: false })); // Prevent continuous reset
    }

    controls.update();
  });

  return null;
};

const HelpOverlay = ({ show, onToggle }) => {
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
    <div style={{
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
      maxWidth: '300px'
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>Keyboard Controls</h3>
      <div><strong>Rotation:</strong></div>
      <div>↑↓←→ - Rotate model</div>
      <div><strong>Pan:</strong></div>
      <div>W/A/S/D - Pan view</div>
      <div>Shift + Arrow keys - Pan view</div>
      <div><strong>Zoom:</strong></div>
      <div>+ / - - Zoom in/out</div>
      <div>Page Up/Down - Zoom in/out</div>
      <div><strong>Reset:</strong></div>
      <div>R or Home - Reset view</div>
      <div><strong>Help:</strong></div>
      <div>H - Toggle this help</div>
      <div style={{ marginTop: '10px', fontSize: '12px', opacity: '0.8' }}>
        Note: Click the 3D viewer first to activate controls
      </div>
    </div>
  );
};

const STLViewer = ({
  fileData,
  onCameraChange,
  savedCameraPosition,
  isEditMode,
  rotationSpeed,
  panSpeed,
  zoomSpeed,
  mouseSpeed,
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
        setInitialPosition(new THREE.Vector3(position.x, position.y, position.z));
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
        rotateSpeed={mouseSpeed}
        panSpeed={mouseSpeed}
        zoomSpeed={mouseSpeed}
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
        rotationSpeed={rotationSpeed}
        panSpeed={panSpeed}
        zoomSpeed={zoomSpeed}
      />
      <mesh geometry={geometry} frustumCulled={false}>
        <meshStandardMaterial attach="material" color={0x808080} />
      </mesh>
    </>
  );
};

const View = (props) => {
  const { 
    file, 
    savedCameraPosition, 
    onCameraChange, 
    isEditMode,
    rotationSpeed = 0.01,
    panSpeed = 0.5,
    zoomSpeed = 0.5,
    mouseSpeed = 1.0
  } = props?.data;
  const [blobUrl, setBlobUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const pannellumRef = useRef(null);

  useEffect(() => {
    if (file?.data) {
      setIsLoading(true);
      const blob = new Blob([Buffer.from(file.data, 'base64')], {
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
          onToggle={() => setShowHelp(prev => !prev)} 
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
            fontSize: '12px'
          }}
        >
          Press H for keyboard controls help
        </div>
        <Canvas
          camera={{ position: [0, 0, -100], fov: 50 }}
          flat
          max-width={'100%'}
          height="auto"
          linear
          tabIndex={0}
          style={{ outline: 'none' }}
          onCreated={({ gl }) => {
            gl.setSize(window.innerWidth, window.innerHeight);
            gl.forceContextRestore();
            gl.domElement.setAttribute('aria-label', '3D Model Viewer - Press H for keyboard controls');
            gl.domElement.setAttribute('role', 'application');
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
              rotationSpeed={rotationSpeed}
              panSpeed={panSpeed}
              zoomSpeed={zoomSpeed}
              mouseSpeed={mouseSpeed}
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
