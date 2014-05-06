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
            if(!error && planData) {
                plan.id = planData.insertId;
                response.send({'information': (!error ? 'plan created' : 'An error has occurred - ' + error), 'plan': plan });
            } else
                response.send({'information': 'An error has occurred - ' + error, 'plan' : plan });
        })
    }
}


/********************************[  PUT   ]********************************/

plan.put.updateInformations = function(request, response) {

}


/********************************[ DELETE ]********************************/



module.exports = plan;