var planProvider = require(global.paths.server + '/database/mysql/tables/plan')
,   directoryProvider = require(global.paths.server + '/database/mongodb/collections/fs/directory')
,   plan = { get : {}, post : {}, put : {}, delete : {} };


/********************************[  GET   ]********************************/

/**
 * Get all plans
 * @param  {object} request
 * @param  {object} response
 */
plan.get.all = function(request, response) {
    planProvider.get.all(function(error, data){
        var plans = [];
        if(data && data.id)
            plans.push(data);
        else if(data && data.length > 0)
            plans = data;
        response.send( (!error ? plans : error ) );
    })
}

/**
 * Get all available images for plans
 * @param  {object} request
 * @param  {object} response
 */
plan.get.images = function(request, response) {
    directoryProvider.get.byPath(1, '/admin/', function(error, data) {
        if(!error && data) {
            var plans = []
            for(var i = 0; i < data.length; i++)
                plans.push(data[i].name);
            response.send(plans);
        } else
            response.send({'information': 'An error has occurred - ' + error});
    })
}


/********************************[  POST  ]********************************/

/**
 * Create a new plan
 *
 *  needed parameters in the body:
 *  {
 *      price: xxx,
 *      name: "xxx",
 *      photo: "xxxxx",
 *      description: "xxxx",
 *      storage: xxx,
 *      duration: xx,
 *      uploadBandWidth: xxxxx,
 *      downloadBandWidth: xxxx,
 *      quota: xxx
 *  }
 *
 * @param  {object} request
 * @param  {object} response
 */
plan.post.create = function(request, response) {
    var params = request.params
    ,   body = request.body
    ,   plan = {
        price: body.price,
        name: body.name,
        photo: body.photo,
        description: body.description,
        storage: parseInt(body.storage, 10),
        duration: parseInt(body.duration, 10),
        uploadBandWidth: parseInt(body.uploadBandwidth, 10),
        downloadBandWidth: parseInt(body.downloadBandwidth, 10),
        quota: body.quota
    };
    planProvider.create.plan(plan, function(error, planData) {
        if(!error && planData)
            plan.id = planData.insertId;
        response.send({'information': (!error ? 'plan created' : 'An error has occurred - ' + error), 'plan': plan });
    })
}


/********************************[  PUT   ]********************************/

/**
 * Update a plan
 *
 *  needed parameters in the body:
 *  {
 *      price: xxx,
 *      name: "xxx",
 *      photo: "xxxxx",
 *      description: "xxxx",
 *      storage: xxx,
 *      duration: xx,
 *      uploadBandWidth: xxxxx,
 *      downloadBandWidth: xxxx,
 *      quota: xxx
 *  }
 *
 * @param  {object} request
 * @param  {object} response
 */
plan.put.byId = function(request, response) {
    var params = request.params
    ,   body = request.body
    ,   witness = true
    ,   plan = {
        id: params.id,
        price: body.price,
        name: body.name,
        photo: body.photo,
        description: body.description,
        storage: body.storage,
        duration: body.duration,
        uploadBandWidth: body.uploadBandwidth,
        downloadBandWidth: body.downloadBandwidth,
        quota: body.quota
    };
    for(var i in plan)
        witness = typeof plan[i] == 'undefined' ? false : witness;

    if(!witness)
        response.send({'information': 'An error has occurred - missing information', 'plan' : plan });
    else {
        planProvider.get.byId(plan.id, function(error, planData) {
            if(!error && planData && planData.id) {
                planProvider.update.all(plan, function(error, data) {
                    response.send({'information': (!error ? 'plan updated' : 'An error has occurred - ' + error), 'plan': plan });
                })
            } else
                response.send({'information': 'An error has occurred - plan not found'});
        });

    }
}


/********************************[ DELETE ]********************************/

/**
 * Delete a plan
 * @param  {object} request
 * @param  {object} response
 */
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