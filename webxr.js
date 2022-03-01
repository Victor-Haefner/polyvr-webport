//webxr

function setupWebXR() {
  let btn = document.createElement("button");
  btn.innerHTML = "Start XR";
  btn.id = "toggleXRbutton";
  btn.addEventListener('click', toggleXR);
  document.body.appendChild(btn);
}

function xrResize() {
  //dev for webVR on HMDs/Phones
  var width = screen.width * window.devicePixelRatio;
  var height = screen.height * window.devicePixelRatio;

  if (navigator.userAgent.includes('Quest')){
    width = 1440*2*window.devicePixelRatio;//canvas.clientWidth * window.devicePixelRatio;
    height = 1660*window.devicePixelRatio;//canvas.clientHeight * window.devicePixelRatio;
    if (navigator.userAgent.includes('Quest 2')){}
  }

  //console.log(window.devicePixelRatio, canvasXR.clientWidth, window.screen.availWidth, window.innerWidth, screen.width, screen.height);
  //console.log(width, height);
  canvasXR.width = width; 
  canvasXR.height = height; 
  //console.log(canvasXR.width, canvasXR.height);
  if (typeof _glutReshapeWindow === "function") _glutReshapeWindow(canvasXR.width, canvasXR.height);
}

function initWebGL2(attributes) {
  canvasXR = document.getElementById('canvas');
  gl = canvasXR.getContext("webgl2", attributes || {alpha: false});
  if(!gl) {
    alert("This browser does not support WebGL 2.");
    return;
  }
  canvasXR.style = "position: absolute; width: 100%; height: 100%; left: 0; top: 0; right: 0; bottom: 0; margin: 0; z-index: -1;";
  document.body.appendChild(canvasXR);
  xrResize();
}

function onSelect(event){
  /*
  let elem = document.getElementById('debugDiv2');
  let debugText = 'finger select event tirggered'
  elem.insertAdjacentHTML('beforeend', debugText);
  */
}

function onSessionStarted(_session) {
  console.log("Starting XR Session");
  xrSession = _session;
  xrSession.addEventListener("end", onSessionEnded);
  xrSession.addEventListener('select', onSelect);

  initWebGL2({xrCompatible: true});

  xrSession.updateRenderState({baseLayer: new XRWebGLLayer(xrSession, gl)});

  xrSession.requestReferenceSpace('viewer').then((refSpace) => {
    xrRefSpace = refSpace;

    xrSession.requestHitTestSource({ space: xrRefSpace }).then((hitTestSource) => {
      xrHitTestSource = hitTestSource;
    });
  });

  xrSession.requestReferenceSpace("local").then((refSpace) => { 
    xrRefSpace = refSpace;

    xrSession.requestAnimationFrame(onSessionFrame);
  });

  function onSessionFrame(t, frame) {
    const session = frame.session;
    session.requestAnimationFrame(onSessionFrame);
    let pose = frame.getViewerPose(xrRefSpace);
    
    if(pose) {
      let tr = pose.transform.position;
      let q1 = pose.transform.orientation;

      execScript('cam_handler',[tr.x.toString(), tr.y.toString(), tr.z.toString(),q1.x.toString(),q1.y.toString(),q1.z.toString(),q1.w.toString()]);
      //console.log(tr.x.toString(), tr.y.toString(), tr.z.toString(),q1.x.toString(),q1.y.toString(),q1.z.toString(),q1.w.toString());
      let glLayer = session.renderState.baseLayer;
  
      for (let view of pose.views) {
        let viewport = glLayer.getViewport(view);

        if ( canvasXR.width != viewport.width || canvasXR.height != viewport.height ) {        
          canvasXR.width = viewport.width;
          canvasXR.height = viewport.height;
          console.log(viewport.width, viewport.height);
          if (typeof _glutReshapeWindow === "function") _glutReshapeWindow(canvasXR.width, canvasXR.height);
        }
      }

      
      if (xrHitTestSource) {
        let hitTestResults = frame.getHitTestResults(xrHitTestSource);
        if (hitTestResults.length > 0) {
          document.querySelector('#place').style.color = "green";
          let pointerPose = hitTestResults[0].getPose(xrRefSpace);
          xrLastKnownHit = pointerPose.transform.position.toJSON();
          xrLastKnownHitOri = pointerPose.transform.orientation.toJSON();
          let tr = pointerPose.transform.position;
          let q1 = pointerPose.transform.orientation;
          execScript('handle',['pointer|place',tr.x.toString(), tr.y.toString(), tr.z.toString(),q1.x.toString(),q1.y.toString(),q1.z.toString(),q1.w.toString()]);
        }
        else {
          document.querySelector('#place').style.color = "red";
        }
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);
      //gl.clearColor(0.4, 0.7, 0.9, 1.0);
      //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      wasmTable.get(GLUT.displayFunc)();
    }
    else {
      console.log("Tracking lost!");
    }
  }

  function onSessionEnded() {
    console.log("Stopping XR Session");
    xrSession = null;
    xrHitTestSource.cancel();
    xrHitTestSource = null;
    window.requestAnimationFrame(checkResize);
    //wasmTable.get(GLUT.displayFunc)();
  }
}

function toggleXR(){
  if(navigator.xr) {
    navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
      if(supported) { 
        if(!xrSession) {
          navigator.xr.requestSession('immersive-ar', {
              requiredFeatures: ['hit-test','local-floor'],
              optionalFeatures: ['dom-overlay'],
              domOverlay: { root: overlay } }
          ).then(onSessionStarted);
        } else {
          xrSession.end();
        }
      }
      else {
        console.log('tried starting AR, but not supported');
      }
    });
  }
}
