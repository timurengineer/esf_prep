# ESF
This app lets users export invoices from government’s invoice system (ESF) to printable PDF format.

It is available at http://esf2.timurz.com/

You will need certificates to login. Test certificates are available at the bottom of login page.

## Features
Back End (node.js)
- hosts front end 
- provides API to the front end.
- accesses government system’s SOAP API. 
- converts data received from the SOAP API to PDF.

Front End (html + js)
- provides user interface
- accesses server API and retrieves data to user