const video = document.getElementById('inputVideo');
const canvas = document.getElementById('canvas');
const inputCMNDFront = document.getElementById('CMNDFront');
const inputCMNDBack = document.getElementById('CMNDBack');

function uploadCMND(event, prev_img_id) {
  $(`#${prev_img_id}`).removeClass('d-none');
  var reader = new FileReader();
  reader.onload = function(){
    var output = document.getElementById(prev_img_id);
    output.src = reader.result;
  };
  reader.readAsDataURL(event.target.files[0]);
  resetDector();
}

function videoOnPlay() {
  if (!inputCMNDFront.files[0] || !inputCMNDBack.files[0]) {
    alert('Chưa có CMND/CCCD mặt trước/ Mặt sau');
    return false;
  }
  loadFaceapi();
  video.play();
  loading(true);
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
        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.55)

        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
        results.forEach((result, i) => {
          canvas.getContext('2d').clearRect(0, 0, video.width, video.height)
          const box = resizedDetections[i].detection.box
          if (result._distance <= 0.55) {
            successDetector(result._distance);
          } else {
            resetDector();
          }
          const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
          drawBox.draw(canvas)
        });

        video.play();
      }, 100)
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
  navigator.mediaDevices.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}

function loadLabeledImages() {
  loading(false);
  const labels = [$('#kh-name').text()]
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 2; i++) {

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


const sp_url = 'http://122.248.226.101:3001';
const api_url = '//122.248.226.101:3000';
// const api_url = 'http://localhost:3000';
const sp_lead_id = window.location.href.split('leads/informations/')[1];
$('#link-back-to-sale-portal').on('click', function(event) {
  event.preventDefault();
  mbal_pathname = window.location.href.split('https://mbal_sales_portal.ngrok.io/?mbal=')[1];
  mbal_link = `http://122.248.226.101:3001${mbal_pathname}`;
  // mbal_pathname = window.location.href.split('?mbal=')[1];
  // mbal_link = `${sp_url}${mbal_pathname}`;
  window.location.href = mbal_link;
});

$(function(){
  $.ajax({
    url: `${api_url}/api/v1/leads/${sp_lead_id}/ekyc_data`
  })
  .done(function(data) {
    console.log(data);
    $('#kh-name').html(data.data.basic_info.name)
  });
});

function loading(visible) {
  if (visible == true) {
    $('.loading').removeClass('d-none');
  } else {
    $('.loading').addClass('d-none');
  }
}

$('.test-submit').on('click', function(event) {
  let $form = $('#formCMNDFront');
  var formData = new FormData($form[0]);

  $.ajax({
    url: `${api_url}/api/v1/media/force_upload`,
    type: 'POST',
    enctype: 'multipart/form-data',
    data: {
      kind: 'lead_doc',
      object_type: 'Lead',
      object_id: sp_lead_id,
      file: inputCMNDFront.files[0]
    },
  })
  .done(function(data) {
    console.log("success");
  })
  .fail(function() {
    console.log("error");
  })
  .always(function() {
    console.log("complete");
  });
});

