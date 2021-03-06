// Based on: https://developers.google.com/maps/documentation/javascript/examples/overlay-popup

/* global google */

const createPopupClass = () => {
  const panToWithOffset = function (map, latlng, offsetX, offsetY) {
    const ov = new google.maps.OverlayView()
    ov.onAdd = function () {
      const proj = this.getProjection()
      const aPoint = proj.fromLatLngToContainerPixel(latlng)
      aPoint.x = aPoint.x + offsetX
      aPoint.y = aPoint.y + offsetY
      map.panTo(proj.fromContainerPixelToLatLng(aPoint))
    }
    ov.draw = function () {}
    ov.setMap(map)
  }

  const Popup = function (position, closedContent, openContent) {
    this.position = position
    const content = document.createElement('div')
    content.classList.add('map-marker__content')
    content.insertAdjacentHTML(
      'beforeend',
      '<button class="map-marker__close">&times;<span class="govuk-visually-hidden">Close this popup</span></button>'
    )
    closedContent.classList.add('map-marker__title')
    openContent.classList.add('map-marker__body')
    content.appendChild(closedContent)
    content.appendChild(openContent)

    this.anchor = document.createElement('div')
    this.anchor.classList.add('map-marker')
    this.anchor.appendChild(content)

    this.stopEventPropagation()

    const $closeButton = content.querySelector('.map-marker__close')
    $closeButton.addEventListener('click', e => {
      this.closeOpenPopups()
    })

    closedContent.addEventListener('click', e => {
      panToWithOffset(this.getMap(), this.position, 0, -70)
      this.closeOpenPopups()
      this.anchor.classList.toggle('open')
      e.stopPropagation()
    })
  }

  // NOTE: google.maps.OverlayView is only defined once the Maps API has
  // loaded. That is why Popup is defined inside createPopupClass().
  Popup.prototype = Object.create(google.maps.OverlayView.prototype)

  // Called when the popup is added to the map.
  Popup.prototype.onAdd = function () {
    this.getPanes().floatPane.appendChild(this.anchor)
  }

  // Called when the popup is removed from the map.
  Popup.prototype.onRemove = function () {
    if (this.anchor.parentElement) {
      this.anchor.parentElement.removeChild(this.anchor)
    }
  }

  // Called when the popup needs to draw itself.
  Popup.prototype.draw = function () {
    const divPosition = this.getProjection().fromLatLngToDivPixel(this.position)
    // Hide the popup when it is far out of view.
    const display = Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000 ? 'block' : 'none'

    if (display === 'block') {
      this.anchor.style.left = divPosition.x + 'px'
      this.anchor.style.top = divPosition.y + 'px'
    }
    if (this.anchor.style.display !== display) {
      this.anchor.style.display = display
    }
  }

  Popup.prototype.closeOpenPopups = () => {
    const $anchors = document.querySelectorAll('.map-marker.open')
    for (let i = 0; i < $anchors.length; i++) {
      $anchors[i].classList.remove('open')
    }
  }

  // Stops clicks/drags from bubbling up to the map.
  Popup.prototype.stopEventPropagation = function () {
    const anchor = this.anchor
    anchor.style.cursor = 'auto';
    ['click', 'dblclick', 'contextmenu', 'wheel', 'mousedown', 'touchstart', 'pointerdown'].forEach(function (event) {
      anchor.addEventListener(event, function (e) {
        e.stopPropagation()
      })
    })
  }

  return Popup
}

const initLocationsMap = () => {
  const Popup = createPopupClass()
  const bounds = new google.maps.LatLngBounds()

  const centerLat = window.trainingLocations[0].lat
  const centerLng = window.trainingLocations[0].lng

  const map = new google.maps.Map(document.getElementById('locations-map'), {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: true,
    fullscreenControlOptions: {
      position: google.maps.ControlPosition.RIGHT_BOTTOM
    },
    zoom: 13,
    center: {
      lat: centerLat,
      lng: centerLng
    },
    styles: [
      {
        featureType: 'poi.business',
        stylers: [
          {
            visibility: 'off'
          }
        ]
      },
      {
        featureType: 'poi.park',
        elementType: 'labels.text',
        stylers: [
          {
            visibility: 'off'
          }
        ]
      }
    ]
  })

  const locations = window.trainingLocations

  for (let i = 0, length = locations.length; i < length; i++) {
    const location = locations[i]
    const latLng = new google.maps.LatLng(location.lat, location.lng)

    const closedContent = document.createElement('div')
    closedContent.innerHTML = location.name

    const openContent = document.createElement('div')
    openContent.insertAdjacentHTML(
      'afterbegin',
      `${location.address ? `<p class="govuk-body">Address:<br> ${location.address}</p>` : ''}`
    )

    const popup = new Popup(latLng, closedContent, openContent)
    popup.setMap(map)

    // Extend the bounds by the first 5 locations so we get a decent number as part of the first view.
    if (i < 5) {
      bounds.extend(latLng)
    }
  }

  // Use provider address to center and zoom when only one location
  if (locations.length > 1) {
    map.fitBounds(bounds)
    map.panToBounds(bounds)
  }
}

window.initLocationsMap = initLocationsMap
