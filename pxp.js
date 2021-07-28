

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
//nyd - Not Yet Done
//Note that we dont have the notion of nested routes yet
pxp.router.setRoutes = function (list) {
    for (var index = 0; index < list.length; index++) {
        var item = list[index];
        //a default page name if the route config is missing the pageName property
        var pageName = 'routeIndex' + index + 'Page';
        if (Object.hasOwnProperty.call(item, "pageName")) {
            pageName = item.pageName;
        }
        //catch all route
        if (item.urlTemplate == "*") {
            pxp.router.catchAllRoute = {
                pageName: item
            };
            continue;
        }
        pxp.router.routeTable[pageName] = item;
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
 */
pxp.router.goToRoute = function (url, data) {
    var queryParams = {}; //passed in after the ? e.g /students?orderBy=desc&gropuBy=classroom
    var urlParams = {};  //passed in as :paramName  e.g /students/23 from the urlTemplate /students/:id

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
        pxp.router.goToRoute(foundConfiguredRoute.redirectsTo, data);
    } else if (foundConfiguredRoute != null) {
        var pageTitle = "";
        if (Object.hasOwnProperty.call(foundConfiguredRoute, "title")) {
            pageTitle = foundConfiguredRoute.title;
        }
        //nyd
        //before enter

        history.pushState({ link: url }, pageTitle, '/#' + url);
        pxp.router.goToPage(foundConfiguredRoute.pageName, data, queryParams, urlParams);
    }
};




