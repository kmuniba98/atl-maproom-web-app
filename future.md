# Future Plans

## Projector Panel

The projector panel information should reflect the choices of the user. Ideally, the user could select a point on the table, and then select the fields they want to view for that point, then have the appropriate fields show up on the panel.

## Config File
Ideally all server settings, Mapbox API information, layers, and map styles should be pulled out of the javascript code and placed into a simple config file that can be accessed by all components of the application. This would reduce errors caused by differing map styles and layer names across different components of the web application.

## Property Assessment Data Reading
We are currently using a package called nthline to pull only the necessary property assessment data entries for properties currently visible on the projector view. This avoids loading the entire file into memory on the Ubuntu VM. However, even with this selective reading method it still takes a significant amount of time to pull the detailed data for the properties. Future work should look into an alternative method to read lines from the CSV file in an optimized way, including potentially ignoring selected columns to reduce the read size.
