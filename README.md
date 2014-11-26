competency-ui
=============

competency-ui is a web site project that allows CRUD interaction with competency objects as part of the DECALS project.

* Easily deployed website in pure Javascript (using Angular JS)
* Perform basic operations on competencies, create models, add competencies, add relationships, create profiles and much more.
* User friendly and professional UI

competency-ui is Open Source under the Apache 2.0 license, the details of which can be found in license.txt.

competency-ui is under active development. It is currently missing functionality, but performs basic core functionality.

Requirements
------------
1. Apache Tomcat Web Server
2. LEVR Server Package (levr-core, levr-base, and eduworks-common repositories)
3. Competency Web Service Scripts (found in levr-scripts/competency)

Installation Instructions
-------------------------
1. Copy the competency-ui directory to the webapps directory of your Tomcat
server
2. Rename the copied directory to "ROOT" if it will be the ROOT directory of
your web server
3. Open js/definitions.js and modify the apiURL value to match your domain or
IP with the URL Path of 'levr/api/custom/competency'

**Finally:** Start the Tomcat server and navigate (via browser) to the 
directory that the UI files were copied to (if ROOT, just navigate to your
domain or IP)

Troubleshooting
---------------
Ensure Tomcat has Read Permissions for all files in the webapps directory

Check that you are using the correct port number for your apiURL definition
and when you navigate via browser to the website.
