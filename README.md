# The Atlanta Map Room

To document and reflect upon the connections and disjunctions between civic data and lived experience in the city, through the collaborative creation of large-scale, interpretive maps.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Installing

After cloning the repository, ensure that node and npm are installed on your machine. Change directory into the main folder and run command `npm install` to install dependencies.

#### Socket.io
A major dependency used in this system is **socket.io**, which provides realtime communication between the different components of the application. The general model consists of different components publishing changes or updates to the socket, which is then processed by the main server and broadcast back out the other components.

### Starting the Server

Navigate to the main directory and then move down one level to the /src folder. Run `node main.js` to start the server, which will listen on the port specified within the files (by default, port 8080).

Once the server is running, you should be able to navigate to the page in a web browser (http://localhost:8080) in order to view the index.html page, which shows links to the Controller, Projector, and Table pages. These three pages can be opened as separate tabs or windows in order to test the system.

#### Testing
With all of the pages open in a browser, basic functionality testing should include the following:
1. Updating the map position on the Controller by dragging should update the map view on the Projector
2. Toggling a layer on the Controller should cause the corresponding layer to be shown or hidden from the Projector
3. Enabling the Tax Assessment layer and zooming in to a smaller region should cause property entries to appear on the Table page
4. Selecting an entry on the Table page should highlight the property in yellow and display detailed information on the Projector
5. (with **sensor_server** running) Moving the projector should smoothly pan the Projector view along the rectangle guide.

## Components

This section describes the primary components of the system in detail.

### Controller
This component consists of two files, **controller.html** and **controller.js**. The Controller is the component of the system that is responsible for choosing the initial map area and toggling layers. When a new area of the map is selected in the Controller map view, the change is sent to the server so that it can be updated on the Projector. The toggling of map layers using the buttons on the right will also update the visible layers on the Projector. There is only one situation in which the Controller is not responsible for movement, which is a Projector nudge.

The Controller view includes a red rectangle that is used to specify the area shown by the projector. This should be used as a guide to control which areas will be shown at the two ends of the final drawn map. There is also a lock button in the upper left corner that will *permanently* lock the map view once a region has been selected for drawing. This prevents unintentional shifting of the map while it is being drawn. Layers can still be toggled and the Projector nudge function is still enabled while the map is locked. In order to unlock the map, the page must be refreshed.

### Projector
This component consists of two files , **projector.html** and **projector.js**. This webpage is designed to provide a simplified map view that would be projected onto the drawing surface. Using data from the sensor supplied by the **sensor_server** (code in separate repository), the projector calculates the current view within the rectangle defined by the Controller as a function of distance between the two end points. For example, when the Projector is pushed to one end of the track, the map will show the leftmost portion of the Controller guide rectangle. As the projector moves, the view will move across the rectangle until it corresponds to the rightmost point of the rectangle guide. The Projector also includes a right panel that provides detailed information for a property tax assessment if it is selected in the Table (see next section).

A keyboard can be used on the Projector to "nudge" the projection in order to fix any alignment issues that may occur after sliding the projector back and forth. The arrow keys pan the map in the corresponding direction, the A and D keys control bearing, and the W and S keys control zoom. Note that the Controller page *must* be open and running in order for the nudge feature to work, because it relies on updating the Controller map. The feature is designed to make extremely small changes on the map so that alignment can be perfected.

### Table
This is an optional component that is used only to provide additional, detailed information about property tax assessments. The code could be repurposed to display data for other datasets as well. When the tax assessment layer is enabled and an area of the city is framed within the controller, the data corresponding to the dots shown will appear in the table. This allows the user to obtain detailed information about a specific property. Selecting an entry in the table will highlight the property on the Projector with a yellow highlighted circle.

Selecting an entry will also populate the right panel of the Projector with the detailed information for that given property.

## Deployment

In order to deploy the system for use with a designated projector system and controller, an ideal setup involves three machines: one as the main server (may be a virtual machine), the second as the projector and sensor server, and the third as a controller (preferably a tablet or other portable device).

Before starting the server, it may be necessary to change the server address and port specified in the config file.

The Controller page and Table page should be opened as two separate tabs on the iPad (or on a designated controller computer). The Projector page should be opened on a web browser on the projector computer, in full screen mode. The projector machine will also be running the **sensor_server**, which will send sensor readings from that machine to the main server.

## Troubleshooting 

For table.js - built around [DataTables](https://datatables.net/), a jQuery plugin. If there is an error in the aligment of the HTML table (example, unequal number of ths and tds), a popup error will be thrown that refers to the row/index. If there is an error in the handling of data - for example, not accessing a nested layer in a JSON object - the data just won't appear in the table, resulting in either missing data or "No data avaliable." message.

## Built With

* [MapBox GL](https://www.mapbox.com/mapbox-gl-js/api/) - Open-source libraries for embedding maps
* [Socket.io](https://socket.io/) - Real-time bidirectional event-based communication
* [Node.js](https://nodejs.org/en/) - JavaScript runtime

## Authors

* **Muniba M. Khan** - *Initial work* - [kmuniba98](https://github.com/kmuniba98)
* **Christopher Polack** - *Initial work* - [cfpolack](https://github.com/cfpolack)
* **Annabel Rothschild** - *Initial work* - [annabelrothschild](https://github.com/annabelrothschild)

See also the list of [contributors](https://github.com/kmuniba98/Atlanta-Map-Room/contributors) who participated in this project.

## Acknowledgments

* Dr. Ellen Zegura, Dr. Chris Le Dantec, Dr. Amanda Meng, Dr. Alex Godwin, Francella Tonge and the Civic Data Science REU
* Jer Thorp, Emily Catedral, and the Office for Creative Research and St. Louis Center for Creative Arts
* Melanie Richard and the support staff of the School of Literature, Media, and Communication
* Digital Integrative Liberal Arts Center at the Georgia Institute of Technology Ivan Allen College of Liberal Arts
