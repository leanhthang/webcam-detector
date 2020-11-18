const video = document.getElementById('inputVideo');
const canvas = document.getElementById('canvas');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
  // faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo)
// ]).then(start)

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}

video.addEventListener('play', () => {
  // const canvas = faceapi.createCanvasFromMedia(video)
  // wrapperBox.append(canvas)
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
        console.log("success")
      }
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      drawBox.draw(canvas)
    })

  }, 50)
})

function loadLabeledImages() {
  const labels = ['Thang']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 2; i++) {

        const avatar = await faceapi.fetchImage(`images/thang1.jpg`)
        const detections = await faceapi.detectSingleFace(avatar)
            .withFaceLandmarks()
            .withFaceDescriptor()
        descriptions.push(detections.descriptor)
        console.log(descriptions)
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}