var express = require('express');
var router = express.Router();

var schema = require('../modules/schema');
var view = require('../modules/view');

// -- 
router.param('configClass', function (req, res, next, configClass) {
  configClass = schema.getConfigClassByPath(configClass);

  if(!configClass) {
    req.params.configClass = null;
  }
  else {
    req.params.configClass = configClass;
  }
  next();
});

// -- Datatables --

router.get('/:configClass', function(req, res, next) {

  var configClass = req.params.configClass;
  if(!configClass) return next();

  var title = configClass.getLabel(req);
  var locals = {
    cols: [],
    options: {
      responsive: true,
      lengthChange: false,
      language: {
        url: 'https://cdn.datatables.net/plug-ins/1.10.10/i18n/French.json'
      },
      ajax: {
        url: '/api/v1/' + configClass.path,
        dataSrc: configClass.path
      },
      columnDefs: []
    }
  };

  // Generic columns --
  configClass.forEachProperty(function(property) {
    if(!property.display_datatable)
      return;

    // Add the column --
    locals.cols.push({
      name: property.name,
      label: property.getLabel(req)
    });

    // Add the js def --
    var def = {
      targets: property.name,
      data: property.name
    };

    if(property.type === 'list')
      def.data += '_label';

    locals.options.columnDefs.push(def);
  });
  
  locals.options = JSON.stringify(locals.options);

  res.render('layouts/datatable', {
    title: title,
    page: {
      header: title,
      newHref: '/animals/' + configClass.path +'/new',
      options: JSON.stringify({
        viewRoute: '/animals/' + configClass.path + '/',
        editLabel: req.t('Edit')
      })
    },
    datatable: locals
  });
});

router.get('/:configClass/new', function(req, res, next) {

  var configClass = req.params.configClass;
  if(!configClass) return next();

  var title = req.t('custom:'+ configClass.name +'.name');
  var inputs = view.generateFormInputLocals(configClass, req);

  res.render('layouts/form', {
    title: title,
    page: { header: title },
    form: {
      header: req.t('Creation'),
      inputs: inputs,
      options: view.populateFormOptions(configClass, 'create', null, req)
    }
  });
});

router.get('/:configClass/:rid', function(req, res, next) {

  var configClass = req.params.configClass;
  if(!configClass) return next();

  var title = req.t('custom:'+ configClass.name +'.name');
  var inputs = view.generateFormInputLocals(configClass, req);

  res.render('layouts/form', {
    title: title,
    page: { header: title },
    form: {
      header: req.t('Edition'),
      inputs: inputs,
      options: view.populateFormOptions(configClass, 'edit', req.params.rid, req)
    }
  });
});


module.exports = router;
