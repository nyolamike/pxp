//1. The pxp global object
var pxp = {};
window.pxp = pxp;



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
pxp.runBootScript: function name(key, pageConfig) {
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
pxpRefresh(){
  pxp.router.refreshPage();
}




