//webxr
var allocations = [];
var xrHitTestSource = null;
var xrLastKnownHit = null;
var xrLastKnownHitOri = null;

function setupWebXR() {
  let btn = document.createElement("button");
  btn.innerHTML = "Start XR";
  btn.id = "toggleXRbutton";
  btn.addEventListener('click', toggleXR);
  document.body.appendChild(btn);

  if (document.getElementById("hudDiv")) {
  } else {
    var div = document.createElement("div");
    div.id = "hudDiv";
    document.body.appendChild(div);
  }
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

function webxrStr(s) {
  ptr = allocate(intArrayFromString(s),0);
  setTimeout(function(){ _free(ptr); }, 5000);
  return ptr;
}

function webxrStrVec(v) {
  var N = v.length;
  //console.log("Länge ist: ", N);
  var arr = new Uint32Array(N);
  for (var i=0; i<N; i++) arr[i] = webxrStr(v[i]);
  ptr = Module._malloc(arr.length * arr.BYTES_PER_ELEMENT);
  allocations.push(ptr);
  Module.HEAPU32.set(arr, ptr >> 2);
  return ptr;
}

function execScript(s, p) {
  __ZN3OSG20PolyVR_triggerScriptEPKcPS1_i(webxrStr(s), webxrStrVec(p), p.length);
  for (var i=0; i<allocations.length; i++) _free(allocations[i]);
  allocations = [];
}

function onSelect(event){
  /*
  let elem = document.getElementById('debugDiv2');
  let debugText = 'finger select event tirggered'
  elem.insertAdjacentHTML('beforeend', debugText);
  */
}

function onSessionEnded() {
  console.log("Stopping XR Session");
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  xrSession = null;
  xrHitTestSource.cancel();
  xrHitTestSource = null;
  checkResize(0);
}

function onSessionStarted(_session) {
  console.log("Starting XR Session");
  xrSession = _session;
  xrSession.addEventListener("end", onSessionEnded);
  xrSession.addEventListener('select', onSelect);

  initWebGL2({xrCompatible: true});
  execScript('cam_saveZero',[]);

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

      //execScript('cam_handler',[tr.x.toString(), tr.y.toString(), tr.z.toString(),q1.x.toString(),q1.y.toString(),q1.z.toString(),q1.w.toString()]);
      //console.log(tr.x.toString(), tr.y.toString(), tr.z.toString(),q1.x.toString(),q1.y.toString(),q1.z.toString(),q1.w.toString());
      __Z13WebXR_setPosePKcfffffff('head',tr.x, tr.y, tr.z,q1.x,q1.y,q1.z,q1.w); //_Z13WebXR_setPosePKcfffffff
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
          let pointerPose = hitTestResults[0].getPose(xrRefSpace);
          xrLastKnownHit = pointerPose.transform.position.toJSON();
          xrLastKnownHitOri = pointerPose.transform.orientation.toJSON();
          let tr = pointerPose.transform.position;
          let q1 = pointerPose.transform.orientation;
          //execScript('handle',['pointer|place',tr.x.toString(), tr.y.toString(), tr.z.toString(),q1.x.toString(),q1.y.toString(),q1.z.toString(),q1.w.toString()]);
        }
        else {
        }
      }
      

      gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);
      wasmTable.get(GLUT.displayFunc)();
    }
    else {
      console.log("Tracking lost!");
    }
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
              domOverlay: { root: hudDiv } }
          ).then(onSessionStarted);
        } else {
          xrSession.end();
        }
      }
      else {
        console.log('tried starting AR, but not supported');
        document.getElementById('toggleXRbutton').innerHTML = "WebXR not supported!";
      }
    });
  }
}
