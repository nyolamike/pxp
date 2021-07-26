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
//a global script that do several things forexample:
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

//pxp.runBootScript is called internall to execute a bootscript after the page dom has been inserted into pxp-app container
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

