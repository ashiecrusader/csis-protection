# csis-protection

This is an application which receives, analyzes and makes decision based on the data received from google forms.

This application is my most recent project, and it's hosted on my raspberry pi. It's connected to the internet thanks to No-IP. I use No-IP to forward the traffic sent to the URL to my raspberry pi, which has an express application listening on port ``3500``. The data gets forwarded to the raspberry pi via a port-forwarding rule set up on my router.

I set up the automatic updates of the public IP address of my network to No-IP using the "Dynamic DNS" option on my router.

## Explanation

This is for a roblox community, called "Canadian Roleplay Community".

There are two google forms, one called "Protection Key Requests" and the second one called "Protection Requests".

The first one is used for requesting a special key, which is later needed for the second form. The google forms conists of 3 questions;
- e-mail address;
- roblox username;
- department they qualify in* (single choice question).

* - a user is expected to be above a rank that's specified for every department.

The e-mail addresses provided are not stored anywhere, they're only requested for the purpose of sending an e-mail containing the key.

### How it works

When a user answers all 3 questions and sends the form, the process beings.

Firstly, the existence of the provided roblox account is checked, if it is, then the next step is to check whether the user requesting the key has a specific phrase in their "about" section on roblox. If they don't, a ``return`` statement prevents any more code from being executed. If their "About" section contains that phrase, then it checks if they actually qualify for the key in the department they provided, the bot checks their rank and compares is using a ``<`` operator, if it's below the minimum value, the execution of the code is stopped.
If it's above or equal to the minimum value,  it checks if that user doesn't already have a key, if they don't, it generates a random string of letters & numbers with a length of 7 characters, then sends an e-mail containing the key to the provided e-mail.

The second form works on basically the same prinicple, except it verifies that the key the user has entered is actuallya valid key, if it isn't, it doesn't execute any more code. If it's however a valid key, but not theirs, it removes their key and the key of the person that the entered key belongs to. This is done because sharing keys/using keys assigned to other people is against our "protection agreements".


**A little addition is an app script that I wrote for both forms, it checks the availability of the application running on the pi by using the ``get`` method on ``URL/status``. If it gets a ``200 OK`` response, it keeps the form open, if it doesn't, it closes the form.**
