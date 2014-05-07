var planProvider = require(global.paths.server + '/database/mysql/tables/plan')
,   plan = { get : {}, post : {}, put : {}, delete : {} };


/********************************[  GET   ]********************************/

plan.get.all = function(request, response) {
    planProvider.get.all(function(error, data){
        response.send( (!error ? data : error ) );
    })
}


/********************************[  POST  ]********************************/

plan.post.create = function(request, response) {
    var params = request.params
    ,   body = request.body
    ,   witness = true
    ,   plan = {
        price: body.price,
        name: body.name,
        storage: body.storage,
        duration: body.duration,
        uploadBandWidth: body.uploadBandWidth,
        downloadBandWidth: body.downloadBandWidth,
        quota: body.quota
    };

    for(var i in plan)
        witness = typeof plan[i] == 'undefined' ? false : witness;

    if(!witness)
        response.send({'information': 'An error has occurred - missing information', 'plan' : plan });
    else {
        planProvider.create.plan(plan, function(error, planData) {
            if(!error && planData)
                plan.id = planData.insertId;
            response.send({'information': (!error ? 'plan created' : 'An error has occurred - ' + error), 'plan': plan });
        })
    }
}


/********************************[  PUT   ]********************************/

plan.put.byId = function(request, response) {
    var params = request.params
    ,   body = request.body
    ,   witness = true
    ,   plan = {
        id: params.id,
        price: body.price,
        name: body.name,
        storage: body.storage,
        duration: body.duration,
        uploadBandWidth: body.uploadBandWidth,
        downloadBandWidth: body.downloadBandWidth,
        quota: body.quota
    };

    for(var i in plan)
        witness = typeof plan[i] == 'undefined' ? false : witness;

    if(!witness)
        response.send({'information': 'An error has occurred - missing information', 'plan' : plan });
    else {
        planProvider.update.all(plan, function(error, planData) {
            response.send({'information': (!error ? 'plan updated' : 'An error has occurred - ' + error), 'plan': plan });
        })
    }
}


/********************************[ DELETE ]********************************/

plan.delete.byId = function(request, response) {
    var params = request.params
    , planId = params.id;

    if(!planId)
        response.send({'information': 'An error has occurred - missing information', 'planId' : planId });
    else {
        planProvider.get.byId(planId, function(error, plan) {
            if(!error && plan && plan.id) {
                plan.available = false;
                planProvider.update.available(plan, function(error, planData) {
                    response.send({'information': (!error ? 'plan deleted' : 'An error has occurred - ' + error), 'plan': plan });
                })
            } else
                response.send({'information': 'An error has occurred - plan not found'});
        })

    }
}



module.exports = plan;