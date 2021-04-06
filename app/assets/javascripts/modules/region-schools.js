/* global $, accessibleAutocomplete */

(function (Modules) {
  'use strict'

  Modules.RegionSchools = function () {
    this.start = function ($el) {
      $el.on('click', '.js-remove', deleteTableRow)
      $el.on('click', '.js-add', addSchool)
      $el.on('submit', '.js-add-form', addSchool)
      var code = $el.data('code')

      var createSimpleEngine = function (values) {
        return function (query, syncResults) {
          var cleanQuery = cleanString(query)

          var matches = values
            .filter(function (r) {
              return cleanString(r).indexOf(cleanQuery) !== -1
            })
            .slice(0, 30)
          syncResults(matches)
        }
      }

      function cleanString (s) {
        return s.toLowerCase().replace(/[,'"().]/g, '').replace(/-/g, ' ')
      }

      accessibleAutocomplete({
        element: document.querySelector('#my-autocomplete-container'),
        id: 'my-autocomplete',
        source: createSimpleEngine(autocompleteOptions),
        autoselect: true,
        minLength: 2
      })

      function addSchool (evt) {
        evt.preventDefault()

        var school = $('#my-autocomplete-container input').val()
        $('#my-autocomplete-container input').val('')

        if (school) {
          var urn = school.match(/\d{6}/)[0]
          var name = school.split('(')[0]
          var location = school.split('(')[1].split(',')[1]

          $('#selected-schools-table tbody').append(`
            <tr class="govuk-table__row" data-urn="${urn}">
              <td class="govuk-table__cell">
                ${name}
              </td>
              <td class="govuk-table__cell">
                ${location}
              </td>
              <td class="govuk-table__cell">
                <a href="#remove" class="js-remove">Remove</a>
              </td>
            </tr>
          `)

          $('#hidden-inputs').append(`
            <input type="hidden" name="${code}-area-schools" value="${school}" id="school-${urn}">
            <input type="hidden" name="${code}-area-school-names" value="${name}" id="school-name-${urn}">
          `)

          hideShowSection()
        }
      }

      function deleteTableRow (evt) {
        evt.preventDefault()
        var row = $(evt.target).parents('tr')
        var urn = row.data('urn')
        row.remove()
        $('#school-' + urn).remove()
        $('#school-name-' + urn).remove()
        hideShowSection()
      }

      function hideShowSection () {
        if ($('#selected-schools-table tbody tr').length > 0) {
          $('#schools-added').show()
        } else {
          $('#schools-added').hide()
        }
      }
    }
  }
})(window.GOVUK.Modules)
