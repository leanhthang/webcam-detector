const video = document.getElementById('inputVideo');
const canvas = document.getElementById('canvas');
const inputCMNDFront = document.getElementById('CMNDFront');

function videoOnPlay() {
  loadFaceapi()
  // video.play();
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
          if (result._distance <= 5) {
            $('#ekyc-label-is-confirm').removeClass('text-danger').addClass('text-success');
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
        console.log(descriptions)
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}