

//1. The pxp global objects
var pxp = {};
window.pxp = pxp;

//the current page is the page which is currently loaded in the pxp-app container
currentPage = null;
window.currentPage = null;



//2. The pxp app container
//we need the id of the dom element that is going to contain the application
//prefrebly its a div within the <body></body> tags
//something like this
// ...
// <body>
//    <div id="pxp-app"></div>
// </body>
// ...
// by default it expects the id to be 'pxp-app'
pxp.elementId = "pxp-app";



//3. Boot scripts
//When a page is inserted into the pxp app container div you may want to execute
//global scripts that do several things forexample:
//  -attaching events to dom elements
//  -calling plugin methods on loaded elements
//
//every boot script is a function that has unique refrence key name
//when a page needs to execute a boot script, it includes it's refrence key name in its setup configuration object,
//then during page creation pxp will execute the referenced bootscripts after inserting the page's dom into the pxp app container
//pxp.bootScripts object stores key-value pairs where by 
//  - the key is the unique refrence key name for the script and 
//  - value is the function of the bootscript
pxp.bootScripts = {};

//to load boot scripts into pxp the method below is called
//for examples
/*
  pxp.setBoot("makeDataTables", function(pageConfig){
    //...any other code here
    
    $(".table").datatable();
    
    //...any other code here
  });
  
*/
//the key is made to be case insensitive as a standard
/**
/ @param {string}   key       -The unique refrence key name for the bootscript
/ @param {function} scriptFn  -The bootscript function
*/
pxp.setBoot = function (key, scriptFn) {
    key = key.trim().toLowerCase();
    this.bootScripts[key] = scriptFn;
};

//pxp.runBootScript is called internally to execute a bootscript after the page dom has been inserted into pxp-app container
/**
/ @param {string} key        -The unique refrence key name for the bootscript
/ @param {object} pageConfig -The setup configuration object of the page that has just been insterted into the pxp-app container
*/
pxp.runBootScript = function name(key, pageConfig) {
    var passedKey = key;
    key = key.trim().toLowerCase();
    if (Object.hasOwnProperty.call(this.bootScripts, key)) {
        this.bootScripts[key](pageConfig);
    } else {
        throw "!pxp Error: Requested boot script of key " + passedKey + " was not found ";
    }
};



//4. The Router
//we need to be able to register routes, map these routes to pages, listen to browser location changes and back/forward navigation commands
//so we set up a router object to handle this kind of work
pxp.router = {}

//The route table is a key value store for routes where by
// -key is the unique page name
// -value is the route/ url template that when visited will cause the associated page to be loaded/inserted
pxp.router.routeTable = {};

//A catch all route object is usefull as a fallback when a user tries to navigate to a page that does not exist 
//Its a nice to hookup a "404 Page NoT Found" at this point
//by default pxp will have this as null
//this will laiter be auto filled when a user provides a route like this 
/*
  ...
  pxp.router.setRoutes([
    {
        urlTemplate: "/login",
        pageName: "loginPage"
    },
    //catch all route
    {
        urlTemplate: "*",
        pageName: "notFound"
    }
  ])             
  ...
*/
pxp.router.catchAllRoute = null;

//we need to store the apps routes in this temporary 
//this enables us to defer setting up the routes only when the pxp.run method is called
pxp.router.rawRoutesList = [];

//by default pxp will not define a global before enter call on routes
//the user is free to provide an inplementation here but before calling the run method
pxp.router.beforeEnter= null;

//The routes of the application are setup by passing an array/list of route configuration objects to this method
//this is done before calling the run method of pxp
//for example 
/*
  ...
  pxp.router.setRoutes([
    {
        urlTemplate: "/login",
        pageName: "loginPage"
    },
    {
        urlTemplate: "*",
        pageName: "notFound"
    }
  ])             
  ...
*/
//A router configuration object has the following structure
// Route Parameters are inserted in the urlTemplate property using :paramName pattern
// Redirects are done using the property redirectsTo
// beforeEnter is a function to call before a route is navigated to
/*
    ...
    pxp.router.setRoutes([
      //example 1 - a students list page
      {
          urlTemplate: "/students",
          pageName: "studentsListPage",
      },
      //example 2 - viewing details of a student
      {
          urlTemplate: "/students/:id",
          pageName: "studentsViewPage",
       },
       //example 3 - redirecting a route
       {
          urlTemplate: "/",
          redirectsTo: "/students"
       },
       //example 4 - many route parameters
       {
          urlTemplate: "/students/:id/exams/:examId/mark",
          pageName: "markStudentsExamPage"
       },
       //example 5 - execute some logic before a route is visited
       {
          urlTemplate: "/students/:id/delete",
          pageName: "deleteStudentPage",
          beforeEnter: function() { ... } 
       },
       //example 6 - assuming that u defined a function called authenticate in some other place in your source code
       {
          urlTemplate: "/exams/:id/delete",
          pageName: "deleteExamPage",
          beforeEnter: authenticate
       },
       //example 7 - catch all
       {
          urlTemplate: "*",
          pageName: "notFoundPage"
       }
     ]);
     ...
*/
//When setRoutes is called with a list of routes they are temprarily stored and there processing
//is defered untill the run method is called, this gives the flexibility to the consumer
//to define the pxp.router.beforeEnter method either before setting up routes or after
//without deferring there would be undesired bad things because routes are dependent on the state of 
//the pxp.router.beforeEnter variable.
//nyd - Not Yet Done
//Note that we dont have the notion of nested routes yet
pxp.router.setRoutes = function (list) {
    if(typeof list == 'object'){
        pxp.router.rawRoutesList = list;
    }else{
        list = pxp.router.rawRoutesList;
        for (var index = 0; index < list.length; index++) {
            var item = list[index];
            var pageName = 'routeIndex' + index + 'Page';
            if (Object.hasOwnProperty.call(item, "pageName")) {
                pageName = item.pageName;
            }
            //beforeEnter
            if(typeof pxp.router.beforeEnter == 'function'){  
                //this means that, the user defined a before Enter for all routes
                if (Object.hasOwnProperty.call(item, "beforeEnter") == false) {
                    //if this route has no beforeEnter property it means we need to subscribe it there
                    item.beforeEnter = true;
                }
            }else{
                //this means that the user has not defined a global before enter 
                if (Object.hasOwnProperty.call(item, "beforeEnter") == false) {
                    //the user has not provided a beforeEnter on the route
                    //we just say that its false
                    item.beforeEnter = false;
                }
            }

            if (item.urlTemplate == "*") { //catch all route
                pxp.router.catchAllRoute = item;
                continue;
            }
            pxp.router.routeTable[pageName] = item;
        }
    }
};


//refreshing the current page
//will cause the browser to reload
pxp.router.refreshPage = function () {
    window.location.href = window.location.href;
    return false;
};
//as a convinience method you can call pxpRefresh(); to do the same thing
pxpRefresh = function(){
    pxp.router.refreshPage();
}

//we need to navigat to a certain url withoud causing a browser reload
//internall the goToRoute will call the gotoPage method after it has 
//successfully matched a url to a page
//internally this method will extract and formulate any parmeters and query data from the url
//it will also perform any redirects were necessary and
//also call the before enter logic if any was configured in the affected routes
//when all goes well it calls the gotoPage method to finally load the page
//if not it will try to load the 404 not found route
/**
 * 
 * @param {string} url      The url to go to 
 * @param {object} data     The payload to send along
 * @param {object} queryParamsRepassed    Optional [undefined] The previously passed queryParams
 * @param {object} urlParamsRepassed      Optional [undefined] The previously passed urlParamsRepassed
 */
pxp.router.goToRoute = function (url, data, queryParamsRepassed, urlParamsRepassed) {
    var queryParams = typeof queryParamsRepassed == "undefined" ? {} : queryParamsRepassed; //passed in after the ? e.g /students?orderBy=desc&gropuBy=classroom
    var urlParams = typeof urlParamsRepassed == "undefined" ? {} : urlParamsRepassed;  //passed in as :paramName  e.g /students/23 from the urlTemplate /students/:id


    //extract the query params from the url
    var urlParts = url.split("?");
    var currentUrlPart = urlParts[0];

    if (urlParts.length > 1) {
        //so we have entries after the ? in the url
        var queryParamsUrlPart = urlParts[1];
        var queryParamsUrlParts = queryParamsUrlPart.split("&");
        for (var index = 0; index < queryParamsUrlParts.length; index++) {
            var queryKeyValueStr = queryParamsUrlParts[index];
            var queryKeyValueStrParts = queryKeyValueStr.split("=");
            var key = queryKeyValueStrParts[0].trim();
            if (key.length == 0) {
                continue;
            }
            queryParams[key] = undefined;
            if (queryKeyValueStrParts.length > 1) {
                var value = queryKeyValueStrParts[1].trim();
                if (value.length > 0 && isNumeric(value)) {
                    value = parseFloat(value);
                }
                queryParams[key] = value;
            }
        }
    }


    //extract Url params
    //and match url based on a score tally
    var currentUrlParts = currentUrlPart.split("/")
    var foundConfiguredRoute = null;
    for (const pageName in pxp.router.routeTable) {
        if (Object.hasOwnProperty.call(pxp.router.routeTable, pageName)) {
            urlParams = {};
            var pageRouteConfig = pxp.router.routeTable[pageName];
            var pageRouteConfigParts = pageRouteConfig.urlTemplate.split("/");
            //the length should be the same
            if (pageRouteConfigParts.length != currentUrlParts.length) {
                //this cannot match
                continue;
            }
            var score = 0;
            for (var index = 0; index < currentUrlParts.length; index++) {
                var currentUrlPart = currentUrlParts[index];
                var pageRouteConfigPart = pageRouteConfigParts[index];
                var urlParamKey = "";
                var urlParamValue = undefined;
                if (pageRouteConfigPart[0] == ":") {
                    urlParamKey = pageRouteConfigPart.replace(":", "").trim();
                    urlParams[urlParamKey] = urlParamValue;
                }

                if (currentUrlPart != pageRouteConfigPart) {
                    //well this may be because pageRouteConfigPart is a param variable e.g :id
                    if (pageRouteConfigPart[0] == ":") {
                        //then we have to believe that its okay
                        if (currentUrlPart.length > 0 && isNumeric(currentUrlPart)) {
                            urlParamValue = parseFloat(currentUrlPart);
                        } else {
                            urlParamValue = decodeQueryParam(currentUrlPart);
                        }
                        urlParams[urlParamKey] = urlParamValue;
                        score = score + 1;
                    } else {
                        //this is not what we are looking for
                        break;
                    }
                } else {
                    if (pageRouteConfigPart[0] == ":") {
                        urlParams[urlParamKey] = decodeQueryParam(currentUrlPart);
                    }
                    score = score + 1;
                }
            }
            if (score == currentUrlParts.length) {
                //we have found our route
                foundConfiguredRoute = pageRouteConfig;
                break;
            }
        }
    }

    if (foundConfiguredRoute == null && pxp.router.catchAllRoute != null) {
        foundConfiguredRoute = pxp.router.catchAllRoute;
    }

    // console.log("found config route  ", foundConfiguredRoute, urlParams);
    if (foundConfiguredRoute != null && Object.hasOwnProperty.call(foundConfiguredRoute, "redirectsTo")) {
        //redirect 
        pxp.router.goToRoute(foundConfiguredRoute.redirectsTo, data, queryParams, urlParams);
    } else if (foundConfiguredRoute != null) {
        var pageTitle = "";
        if (Object.hasOwnProperty.call(foundConfiguredRoute, "title")) {
            pageTitle = foundConfiguredRoute.title;
        }
      
        //before enter
        var b4EnterArgs = {
            route: JSON.parse(JSON.stringify(foundConfiguredRoute)),
            data: data,
            queryParams: queryParams,
            urlParams: urlParams
        };
        if (typeof pxp.router.beforeEnter == 'function') {
            //user has defined a global before enter function
            //so we check if this route is into these things
            if (Object.hasOwnProperty.call(foundConfiguredRoute, "beforeEnter") &&
                foundConfiguredRoute.beforeEnter === true
            ) {
                //excute the routers global before Enter
                pxp.router.beforeEnter(b4EnterArgs, proceed);
            } else if (Object.hasOwnProperty.call(foundConfiguredRoute, "beforeEnter") &&
                typeof foundConfiguredRoute.beforeEnter == "function"
            ) {
                //so we have a custome before enter logic, we need to call it before it's crazy 
                foundConfiguredRoute.beforeEnter(b4EnterArgs, proceed);
            }else{
                proceed();
            }
        } else {
            //so lets just consider this dude
            if (Object.hasOwnProperty.call(foundConfiguredRoute, "beforeEnter") &&
                typeof foundConfiguredRoute.beforeEnter == "function"
            ) {
                //so this means that this particular route has defined its own thing
                foundConfiguredRoute.beforeEnter(b4EnterArgs, proceed);
            } else {
                proceed(); //we are go to go
            }
        }
    }
};

//This method is not to be called from the outside
//its called internally by pxp to load the page
//Here though before a page is loaded if it has a master page layout, its layout will first
//be loaded then the actuall page is loaded
//Its will finall call the internal method called render page to 
//finally insert the page into the pxp-app container element
//It will also sets the currentPage and currentPage name variables
/**
 * 
 * @param {string} name     The name of the page to load
 * @param {*} data          The data passed to it from an external source
 * @param {*} queryParams   The data in the url params after the ?
 * @param {*} urlParams     The parameters data in the url template
 */
pxp.router.goToPage = function (name, data, queryParams, urlParams) {
    // console.log("We are gona load this page ");
    // console.log("name:", name);
    // console.log("data:", data);
    // console.log("queryParams:", queryParams);
    // console.log("urlParams:", urlParams);
    if (Object.hasOwnProperty.call(pxp.pages, name)) {
        var pageToLoad = pxp.pages[name];
        //check if it has a master page
        if (Object.hasOwnProperty.call(pageToLoad, "masterPage") && pageToLoad.masterPage.length > 0) {
            //get the masterpage asked for
            if (Object.hasOwnProperty.call(pxp.pages, pageToLoad.masterPage)) {
                var masterPageConfig = pxp.pages[pageToLoad.masterPage];
                //check if master page is already loaded
                if (Object.hasOwnProperty.call(masterPageConfig, "placeholderId") && masterPageConfig.placeholderId.length > 0) {
                    var placeholderId = masterPageConfig.placeholderId;
                    if ($("#" + placeholderId).length > 0) {
                        //console.log("big tips ", placeholderId, pageToLoad);
                        //this master page is already loaded
                        pxp.currentPageName = pageToLoad.name;
                        currentPage = pxp.pages[pxp.currentPageName];
                        pxp.router.renderPage(pageToLoad, placeholderId, data, queryParams, urlParams);
                    } else {
                        pxp.router.renderPage(masterPageConfig, pxp.elementId, data, queryParams, urlParams);
                        pxp.currentPageName = pageToLoad.name;
                        currentPage = pxp.pages[pxp.currentPageName];
                        pxp.router.renderPage(pageToLoad, placeholderId, data, queryParams, urlParams);
                    }
                } else {
                    console.error("!Orror: master page " + pageToLoad.masterPage + " is missing property placeholderId, it should have a unique value in the entire application dom");
                    return false;
                }
            } else {
                console.error("!Orror: master page " + pageToLoad.masterPage + " required for the child page " + name + " was not registered via pxp.createPage");
                return false;
            }
        } else {
            //no master page
            pxp.currentPageName = pageToLoad.name;
            currentPage = pxp.pages[pxp.currentPageName];
            pxp.router.renderPage(pageToLoad, pxp.elementId, data, queryParams, urlParams);
        }
    } else {
        console.error("!Orror: page " + name + " not registered via pxp.createPage");
        return false;
    }
};


//finally you want to render the page
//rendering the page means inserting it into the pxp-app container
//this method performes the following operations
//1. gets the template of the page and inserts it into the traget container
//   the target container could be the pxp-app or a master page content place holder, thats why we
//   pass the insertInId parameter
//2. It replaces any short hand like @pg with the current path to that page
//3. It will run any scheduled bootscripts on the page after inserting the dome into the respective container
//4. It then adds one way binding to any model inputs to their data states in the page
//5. It then auto calls the onInseted methods of nay page sections if the seeting is true
/**
 * 
 * @param {object} pageToLoadConfig The page to be inserted
 * @param {string} insertInId The id of the dome element where the page template is to be inserted
 * @param {object} data The data passed along
 * @param {object} queryParams The query parameters from the url after the ?
 * @param {*} urlParams the url params  from the urlTemplate in the route
 */
pxp.router.goToPage.renderPage = function(pageToLoadConfig, insertInId, data, queryParams, urlParams) {
    //no master page
    // console.log("The prob ", insertInId);
    $("#" + insertInId).html("");
    var rawPageHtml = pageToLoadConfig.getTemplate(data, queryParams, urlParams);
    //replacing current page
    if (rawPageHtml.indexOf("@pg.")) {
        rawPageHtml = rawPageHtml.split("@pg.").join("pxp.pages." + pxp.currentPageName + ".");
    }
    $("#" + insertInId).html(rawPageHtml);
    //run selected boot scripts
    if (Object.hasOwnProperty.call(pageToLoadConfig, "bootScripts") &&
        Object.hasOwnProperty.call(pageToLoadConfig.bootScripts, "length") &&
        pageToLoadConfig.bootScripts.length > 0
    ) {
        for (var index = 0; index < pageToLoadConfig.bootScripts.length; index++) {
            var bootScriptName = pageToLoadConfig.bootScripts[index];
            pxp.runBootScript(bootScriptName, pageToLoadConfig);
        }
    }
    //bind inputs
    pxp.bindInputs();
    //call the on inserted
    if (Object.hasOwnProperty.call(pageToLoadConfig, "autoCallSectionsOnInserted") &&
        pageToLoadConfig.autoCallSectionsOnInserted == true
    ) {
        pageToLoadConfig.onSectionsInserted(data, queryParams, urlParams);
    }
    pageToLoadConfig.onInserted(data, queryParams, urlParams);
}



//5. Starting The PXP APP - The run method
//To run a pxp application this method is called, it expects an Id of the dom element where the app is to be placed
//by default this is set to "pxp-app"
//The run method will fetch the currrent browser location and prepare some navigation aspects before 
//calling the pxp.router.gotoRoute
/**
 * 
 * @param {string} elementId The id of the element where the app is to be inserted
 */
pxp.run = function (elementId) {
    if (typeof elementId != 'undefined') {
        this.elementId = elementId;
    }
    //set up the routes
    pxp.router.setRoutes(true);
    window.addEventListener('popstate', function (event) {
        var currentUrl = window.location.hash;
        if (currentUrl == "") {
            currentUrl = "/";
        } else {
            currentUrl = currentUrl.replace("#", "");
        }
        pxp.router.goToRoute(currentUrl, event.state);
    });
    var currentUrl = window.location.hash;
    if (currentUrl == "") {
        currentUrl = "/";
        //check if we have any ?
        if(window.location.href.indexOf("?") > 0){
            currentUrl = "/?" + (window.location.href.split("?"))[1];
        }
    } else {
        currentUrl = currentUrl.replace("#", "");
    }
    pxp.router.goToRoute(currentUrl, { payload: true });
}



//6. Components
//components a the smallest building blocks, 
//they use functions that return a string of html given an input configuration
//ideally they are not supposed to keep track of state/any data 
//In case a components needs to manipulate dom elements then its registered  
//as an object in the pxp.cmps variable so as to group functionality that manuplates instances of that component
//each component has a unique name
//as a convention components end with a "Cmp"
//component files should be placed inside of a components folder and end with "Cmp.js"

//a global registry of the application components
pxp.cmps = {};

//to create a component call the pxp.createCmp method
//for example
/*
  pxp.createCmp({
    name: "helloCmp",
    getTemplate: function(config){
      return "<div>Hallo " + config.firstName + "</div>";
    }
  });
  //to use this component in several places
  pxp.cmps.helloCmp.getTemplate({firstName: "Sam" }); //out puts <div>Hallo Sam</div>
  
  //also we can have function only components if no common component manipulation functionality is requeired
  var helloCmp = function(config){
    return '<div id="'+config.id+'" >Hallo <span>' + config.firstName + '<span></div>';
  };
  //when we need to use it
  helloCmp({id:23, firstName: "Sam" }); //out puts <div id="23">Hallo Sam</div>
  
  //now we can have both pxp comps and stand alone functiona at the smae time
  //we can also group all methods thats work on these component under this name space pxp.cmps.helloCmp
  pxp.createCmp({
    name: "helloCmp",
    getTemplate: function(config){
      return helloCmp(config);
    },
    setName: function(person){
      $("#" + person.id + " span").html(person.firstName);
    }
  });
  
  //now when we can have several components
  helloCmp({id:23, firstName: "Sam" });
  helloCmp({id:24, firstName: "Lydia" });
  helloCmp({id:25, firstName: "Peter" });
  //when we need to manipulate we can then call one of the functions in the compents namesapce
  pxp.cmps.helloCmp.setName({id:24, firstName: "Roselyn" });
*/
pxp.createCmp = function (config) {
    if (Object.hasOwnProperty.call(config, "onInserted") == false) {
        config.onInserted = function () {
            return false;
        };
    }
    pxp.cmps[config.name] = config;
};

//to have one way binding to inputs elements so that when a model property can be bound to an input element
/*
  <input model="@pg.createForm.name" />
  will bind this form to a pxp.pages.userPage.createForm.name within a context
  ...
  {
    createForm: {
      name: ""
    }
  }
  ...
*/
// nyd
// provide more explanation details for these concepts below
//a custome getValue method can be hooked up 
// you can force pxp to return the value corsed as a specific type useing parse Attribute
// you can provide a call back function after the value is set on an input using onSetValue
/**
/ @param {string} context A selector string e.g #id .class etc
*/
pxp.bindInputs = function (context) {
    if (typeof context == "undefined") {
        context = "";
    }
    var inputs = $(context + " input[model], " + context + " select[model]");
    if (inputs.length > 0) {

        inputs.each(function (index, element) {
            var target = $(element);
            //remove previous bindings to change
            target.off("change");
            //add this binding
            target.on("change", function (event) {
                var thisInput = $(event.target);
                var model = thisInput.attr("model");
                var val = thisInput.val();
                if (typeof val == 'string') {
                    val = val.trim();
                }

                //check if we have overriding getValue 
                var getValue = thisInput.attr("getValue");
                if (typeof getValue !== 'undefined' && getValue !== false) {
                    if (typeof getValue == "string") {
                        if (getValue.indexOf("(") >= 0) {
                            getValue = (getValue.split("("))[0];
                        }
                        var t_g_t_temp_pxp1123 = event.target;
                        var vmExec = getValue + "(t_g_t_temp_pxp1123);";
                        val = eval(vmExec);
                    } else if (typeof getValue == 'function') {
                        val = getValue(event.target);
                    }
                }

                var parse = thisInput.attr("parse");
                if (typeof parse !== 'undefined' && parse !== false) {
                    if (parse == 'int') {
                        val = parseInt(val);
                    }
                    if (parse == 'bool' || parse == 'boolean') {
                        var trueStrs = ["on", "yes", "true", "ok", "1"];
                        if (typeof val == 'boolean') {
                            val = val;
                        } else if (typeof val == 'string' && trueStrs.indexOf(val.toLowerCase().trim()) >= 0) {
                            val = true;
                        } else {
                            val = false;
                        }
                    }
                }

                // console.log("on bing change ", model, val);
                var assign = model + " = val;";
                eval(assign);

                //if onSetValue
                var onSetValue = thisInput.attr("onSetValue");
                if (typeof onSetValue !== 'undefined' && onSetValue !== false) {
                    if (typeof onSetValue == "string") {
                        if (onSetValue.indexOf("(") >= 0) {
                            onSetValue = (onSetValue.split("("))[0];
                        }
                        var e_v_n = new Event("onSetValue");
                        var vmExec = onSetValue + "(e_v_n,val);";
                        eval(vmExec);
                    } else if (typeof onSetValue == 'function') {
                        onSetValue(new Event("onSetValue"), val);
                    }
                }
            });
        });
    }
};

//when editing we may want to auto fill our inputs with data from a model
//this method does that, it howver works for only inputs with the model attribute set to a 
//path of the bound variable
/**
 * 
 * @param {string} wrapperId The id of form elements container
 * @param {Object} overrideModel Optional - a model to override the default source of the values
 */
pxp.fillInputs = function(wrapperId, overrideModel) {
    if (typeof overrideModel == "undefined") {
        overrideModel = {};
    }
    var cntxt = "";
    if (wrapperId[0] == "#") {
        cntxt = wrapperId;
    } else {
        cntxt = "#" + wrapperId;
    }
    var inputs = $(cntxt + " input[model], " + cntxt + " select[model] ");
    if (inputs.length > 0) {
        inputs.each(function (index, element) {
            var target = $(element);
            var modelPath = target.attr("model");
            var modelPathParts = modelPath.split(".");
            var lastPathPart = modelPathParts.length > 0 ? modelPathParts[modelPathParts - 1] : "";
            var assignValue = undefined;
            if (Object.hasOwnProperty.call(overrideModel, lastPathPart)) {
                //we can override
                assignValue = overrideModel[lastPathPart];
            } else {
                assignValue = eval(modelPath);
            }
            //if setValue
            var setValue = target.attr("setValue");
            if (typeof setValue !== 'undefined' && setValue !== false) {
                if (typeof setValue == "string") {
                    if (setValue.indexOf("(") >= 0) {
                        setValue = (setValue.split("("))[0];
                    }
                    var e_v_n_t = target[0];
                    var vmExec = setValue + "(e_v_n_t,assignValue);";
                    eval(vmExec);
                } else if (typeof setValue == 'function') {
                    setValue(target[0], assignValue);
                }
            } else {
                target.val(assignValue);
            }
        });
    }
};

//to auto replace short hands, and bind and fill inputs this convenince method can be called
//especiall luse full when the content is insetred dynamically during running of the app
/**
 * 
 * @param {string} context the wraper select query string
 * @param {*} content the html content
 * @param {*} fillModel a model to get values from, in case of overriding needs
 * @param {*} callback Optional - a call back to be called when its done
 */
pxp.render = function (context, content, fillModel, callback) {
    if (typeof callback == 'undefined') {
        callback = function () { };
    }
    if (content.indexOf("@pg.")) {
        content = content.split("@pg.").join("pxp.pages." + pxp.currentPageName + ".");
    }
    $(context).html(content);
    this.bindInputs(context);
    this.fillInputs(context,fillModel);
    callback();
}



//7. Pages
//a page is a page in pxp.js, it a the whole page for example, Home, about us, gallary etc
pxp.pages = {};

//pxp keeps track of the name of the current loaded page 
pxp.currentPageName = "";

//to create a page in pxp we use pxp.createPage(config)
//- every page must have a unique name and will be in the namesapce pxp.pages.pageName
//where pageName id the actuall name of your page 
// -this method makes suer that if the pageConfig object is missing an onInserted property one is
//atuo created for the page
//- autoCallSectionsOnInserted by default is set to true if one is not passed along
//this property tells pxp to automatically call the onInseted method of tits child sections
//- the creatPage will also hookup an onSectionsInserted method that is called to run
//all the onInserted methods of its child sections
//pxp will call this method before finally calling the page's onInserted
//below is an example of creating a page
/*
    pxp.createPage({
        name: "studentsListPage",
        masterPage: "mainLayoutPage",
        getTemplate: function(data, queryParams, urlParams){
            return "<div>... table of students goes here ...</div>";
        },
        onInserted: function(data, queryParams, urlParams){
            //todo
            //fetch students data from the backend API
        }
    });
*/
// the masterPage property tells pxp that this page is to be inseted into a master layout page
/**
 *
 * @param {object} config The configuration object of the page
 * 
 */
pxp.createPage = function (config) {
    // console.log("Creating page ", config);
    // console.log(config.getTemplate());
    if (Object.hasOwnProperty.call(config, "onInserted") == false) {
        config.onInserted = function (data, queryParams, urlParams) {
            return false;
        };
    }
    if (Object.hasOwnProperty.call(config, "autoCallSectionsOnInserted") == false) {
        config.autoCallSectionsOnInserted = true;
    }

    if (Object.hasOwnProperty.call(config, "onSectionsInserted") == false) {
        config.onSectionsInserted = function(data, queryParams, urlParams){
            //first call the child on Inserted onInsertedSectionCalls
            if (Object.hasOwnProperty.call(this, "onInsertedSectionCalls")) {
                for (var index = 0; index < this.onInsertedSectionCalls.length; index++) {
                    var sectionName = this.onInsertedSectionCalls[index];
                    if (Object.hasOwnProperty.call(this, sectionName)) {
                        if (Object.hasOwnProperty.call(this[sectionName], "onInserted")) {
                            (this[sectionName]["onInserted"])(data, queryParams, urlParams);
                        }
                    }
                }
            }
        }
    } 
    pxp.pages[config.name] = config;
};



//8. sections
//a single page file quickly becomes blobed with too many functionalities even if you have these
//separated within components, components for the most part are really small.
//the page can be further broken down into sections, these accomplish a particular objective
//usually grouping several components but have a tight link to the page
//when a section is created before its parent page has been loaded it will be defered or it wont 
//exist until the parent page has been stored in the pxp.pages namesapace
pxp.differedSections = {};

//to create a section of a page
//this methos replaces the original getTemplate of a section with a modified one
//that does some shorthand replacements
//if the section has an on inserted method then it it wil be called before the parents on iserted method
pxp.createSection = function (pageName, config) {
    if (Object.hasOwnProperty.call(config, "name") == false) {
        throw "!Orror. A page section must have a name, failed to add section to page " + pageName;
        return false;
    }
    if (Object.hasOwnProperty.call(pxp.pages, pageName) == true) {
        if (Object.hasOwnProperty.call(config, "getTemplate") == true) {
            config.innerGetTemplate = config.getTemplate;
            config.getTemplate = function (configTemp) {
                var content = this.innerGetTemplate(configTemp);
                content = content.split("@pgx.").join("pxp.pages." + pageName + "." + this.name + ".");
                return content;
            };
        }
        if (Object.hasOwnProperty.call(config, "onInserted") == true) {
            if (Object.hasOwnProperty.call(pxp.pages[pageName], "onInsertedSectionCalls") == false) {
                pxp.pages[pageName]["onInsertedSectionCalls"] = [];
            }
            pxp.pages[pageName]["onInsertedSectionCalls"].push(config.name);
        }
        pxp.pages[pageName][config.name] = config;
    } else {
        //nyd
        //differ this section untill the page configuration is loaded
        //pxp.differedSections[pageName] = 
        throw "!Orror. Cannot add section to a missing page/ or a page which is not yet loaded :" + pageName + ", section " + config.name;
    }
};



//8. Event Bus
//the event bus system in pxp is a publish subscribe design to allow a more scallable
//architecture of communication between different sections and componente of a loaded page
//global events stores published events
pxp.globalEvents =  {};

//a page or section or anything really can create an event
/**
 * 
 * @param {string} eventName The name of the string
 * @param {string} context Optional, The name of the context in which this event operates, default is * which means global
 * @param {function} defaultFn Optional. The default function associated with the event
 */
pxp.createEvent = function (eventName, context, defaultFn) {
    if (typeof context == 'undefined') {
        context = "*";
    }
    if (typeof defaultFn == 'undefined') {
        defaultFn = function (params) { };
    }
    this.globalEvents[eventName] = {
        subscribers: [],
        context: context,
        defaultFn: defaultFn
    };
};

//inside functions or methods events can be emitted
//if the event was not created before then nothing will happen
//the default function associated with the even is called first with a payload from the event source/generator
//then all subscribers to this event that fit within the same context are alerted by executing their associated calls with the payload
//and subscription associated data
//the data passed along is cloned so that subscribers dont alter the orignal data and spoil its integrity for other subscribers
/**
 * 
 * @param {string} eventName The name of the event to be emitted
 * @param {any} payLoadPassedAlong any data to send along
 */
pxp.emitEvent = function (eventName, payLoadPassedAlong) {
    var payLoad = null;
    //make a deep data only copy of the payload
    if(typeof payLoadPassedAlong != "undefined"){
        payLoad = JSON.parse(JSON.stringify(payLoadPassedAlong));
    }
    if (Object.hasOwnProperty.call(this.globalEvents, eventName)) {
        var event = this.globalEvents[eventName];
        //run default fn
        event.defaultFn(payLoad);
        //alert the subscribers that this event has happened
        for (var index = 0; index < event.subscribers.length; index++) {
            var subscriber = event.subscribers[index];
            if (event.context == "*") {
                //no filters on the event side
                if (subscriber.context == null || subscriber.context == "*") {
                    //the subscriber should also have no feelings attached
                    subscriber.handler(subscriber.data, payLoad, context);
                }
            } else {
                //excute if contexts are the same
                if (event.context == subscriber.context) {
                    subscriber.handler(subscriber.data, payLoad, context);
                }
            }
        }
    }
};

//to subscribe to events, it required to pass a unique key identiier for the subscriber
/**
 * 
 * @param {string} key the unique name of the subscriber
 * @param {string} eventName The name of the event
 * @param {any} data the data that will be passed back to you when the event occurs
 * @param {string} context the execution context
 * @param {function} handler the event handler function
 */
pxp.subscribeToEvent = function (key, eventName, data, context, handler) {
    if (Object.hasOwnProperty.call(this.globalEvents, eventName)) {
        this.globalEvents[eventName].subscribers.push({
            key: key,
            data: data,
            handler: handler,
            context: context
        });
    }
};

//to unsubscribe from an event
/**
 * 
 * @param {string} key the subscribers unique name
 * @param {string} eventName the event name
 */
pxp.unSubscribeFromEvent = function (key, eventName) {
    if (Object.hasOwnProperty.call(this.globalEvents, eventName)) {
        var subs = this.globalEvents[eventName].subscribers;
        var indeAt = -1;
        for (var index = 0; index < subs.length; index++) {
            var sub = subs[index];
            if (sub.key == key) {
                indeAt = index;
                break;
            }
        }
        if (indeAt != -1) {
            this.globalEvents[eventName].subscribers.splice(indeAt, 1);
        }
    }
};

//8. Utils
//some common functions that used frequently
/**
* This will pick an item from a list whose value of a property (default id) is equal to the value searched for
* @param {any} itemId The value of a property/attribute to look for
* @param {array} list The list of objects to search from
* @param {string} prop The name of the property to consider, default is id
*/
pxp.pick = function (itemId, list, prop) {
    if (typeof prop == 'undefined') {
        prop = "id";
    }
    var item = null;
    for (var index = 0; index < list.length; index++) {
        var listItem = list[index];
        if (listItem[prop] == itemId) {
            item = listItem;
            break;
        }
    }
    return item;
};


