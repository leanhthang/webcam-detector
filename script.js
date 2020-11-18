const video = document.getElementById('inputVideo');
const canvas = document.getElementById('canvas');
const inputCMNDFront = document.getElementById('CMNDFront');

function uploadCMND(event, prev_img_id) {
  $(`#${prev_img_id}`).removeClass('d-none');
  var reader = new FileReader();
  reader.onload = function(){
    var output = document.getElementById(prev_img_id);
    output.src = reader.result;
  };
  reader.readAsDataURL(event.target.files[0]);

  // video.pause();
  // video.currentTime = 0;

  resetDector();
}

function videoOnPlay() {
  if (!inputCMNDFront.files[0]) {
    alert('Chưa có CMND/CCCD mặt trước');
  }
  loadFaceapi();
  video.play();
  video.onplay = function() {
      const displaySize = { width: video.width, height: video.height }
      faceapi.matchDimensions(canvas, displaySize)
      console.log("asdas")
      setInterval(async () => {
        // let image = await faceapi.fetchImage(avatar.src)
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks().withFaceDescriptors()
        // .withFaceExpressions()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)


        const labeledFaceDescriptors = await loadLabeledImages()
        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)

        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
        results.forEach((result, i) => {
          canvas.getContext('2d').clearRect(0, 0, video.width, video.height)
          const box = resizedDetections[i].detection.box
          if (result._distance <= 0.5) {
            successDetector(result._distance);
          } else {
            $('#ekyc-alert-success').addClass('d-none');
          }
          const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
          drawBox.draw(canvas)
        })
      }, 50)
  };
}

function loadFaceapi() {
  Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
  ]).then(startVideo);
}
function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}

function loadLabeledImages() {
  const labels = ['Thang']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 2; i++) {

        // const avatar = await faceapi.fetchImage(`images/thang1.jpg`)
        const cmnd = await faceapi.bufferToImage(inputCMNDFront.files[0]);
        const detections = await faceapi.detectSingleFace(cmnd)
            .withFaceLandmarks()
            .withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}

function resetDector(){
  $('#ekyc-label-is-confirm').removeClass('text-success').addClass('text-danger').html('(Chưa xác thực)');
  $('#ekyc-alert-success').addClass('d-none');
  // canvas.getContext('2d').clearRect(0, 0, video.width, video.height)
}

function successDetector(distance) {
  $('#ekyc-label-is-confirm').removeClass('text-danger').addClass('text-success').html('(Đã xác thực)');
  $('#ekyc-alert-success').removeClass('d-none');
  percent = Math.round((1-distance)*100);
  $('#ekyc-like-percent').html(`~${percent}%`);
}