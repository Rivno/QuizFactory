
/**
 * Map routes
 * @param app : express application
 * @param prefixArray : array of controller prefix
 */
exports.map = function(app, controllerArray){

    if(controllerArray instanceof Array){
        if(controllerArray.length == 0){
            throw new Error('Empty array of prefix parameter');
        }

        for (var i = 0; i < controllerArray.length; i++) {
            var controller = controllerArray[i];
            var routeParam = controller.name;
            console.log('controller : ' + routeParam);

            app.get('/' + routeParam, controller.index);

            console.log('route : /' + routeParam + ' created');

            for (var action in controller) {
                if (typeof controller[action] === 'function') {
                    app.get('/' + routeParam + '/' + action, controller[action]);
                    console.log('route : /' + routeParam + '/' + action + ' created');
                }
            }
        }
    }
    else{
        throw new Error('Prefix parameter is not an array');
    }

}