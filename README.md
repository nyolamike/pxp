# pxp
Page By Page is a very simple javascript library for building single page application (SPAs) based on jquery


# Installation
First include jquery before you include pxp
```
<!DOCTYPE html>
<html>
 <head>
      <!--  header things go here    -->
 </head>
 <body>
    <div id="pxp-app" ></div> 
    
    <!-- jquery -->
    <script src="js/jquery/jquery.min.js"></script>
    <!-- pxp -->
    <script src="js/pxp/pxp.min.js"></script>
    <script src="js/pxp/pxpHtml.min.js"></script>
    
    <!-- application scripts -->
    <!-- the home page   -->
    <script src="pages/homePage/index.js"></script>
    
    <!-- application routes   -->
    <script src="router.js"></script>
    
    <script>
      $(function(){
          //run the pxp app
          pxp.run("pxp-app");
      });
    </script>
 </body>
</html>
```

# Project Folder Structure
pxp does not impose a certain way that you should organise your project files, the structure below is just an example 
to put things into perspective as far as this readme file is concerned

```bash
|-- css 
|
|-- js 
|   |
|   |--pxp  
|   |  |    
|   |  |--pxp.min.js
|   |  |             
|   |  |--pxpHtml.min.js 
|   |  
|   |--jquery 
|      | 
|      |-- jquery.min.js 
|
|-- components
|
|-- pages
|   |
|   |--homePage
|      |
|      |--index.js
|       
|-- index.html
|
|-- router.js
```
       
# Roadmap v1.0.0
- [x] core pxp.js library
  - [x] global pxp objects
  - [x] pxp app container
  - [x] boot scripts
  - [x] router
  - [x] starting the pxp app
  - [x] components
  - [x]  pages
  - [x] sections
  - [ ] event bus
  - [ ] utils
- [ ] pxpHtml library
- [ ] Readme.md
- [ ] wiki
- [ ] contributors
- [ ] youtube videos
- [ ] example projects
  
  # Feature Sugestions
  1.loading in of .html templates
  2.@scx.title short hand syntax
  3.lazy loading of resources or on demand loading of resources
