# Documentation API Wablas

English

[Indonesia](https://bdg.wablas.com/lang/id)

# Documentation API Gateway

Last updated: February 8th, 2023

## Welcome Back

### Intro

WABLAS is WhatsApp API gateway service for sending and receiving messages, notification, scheduler, reminder, group message, tracking, and chatbots with simple integration for your business

Our API was designed to be extremely easy to use and accessible to everyone, no matter the programing language or frameworks you use

**Max size file for video,audio,image,& document for media message is 2 MB**

### Whatsapp Number Verification for Sender

1.  Select Device menu then click Scan QR Code Icon.
2.  Please wait a moment, the qr code image will appear immediately. then you can do a scan with the whatsapp application
3.  Please wait about 5 minutes, You will get a WhatsApp notification if your device is connected to Wablas.
4.  If you successfully scan the QR Code and after 5 minutes can't connected, please contact us (IT support).
5.  If the service is active you can send text messages or images, with the API that we have provided.

*   **_Note:_**  
    If you log out of your WhatsApp application or change WhatsApp number, make sure to scan the QR code again.

### Get Whatsapp Group ID

1.  Make sure your device Connected & became Admin/member of Group Whatsapp.
2.  Activate Get Incoming Message on Device setting.
[Image: list1](https://converturltomd.com/assets/images/gallery/api/incoming.jpg)  
  
6.  Send message from your phone to Group Whatsapp.
7.  Open Menu Inbox Wablas
8.  Now you can Copy Group ID
[Image: list1](https://converturltomd.com/assets/images/gallery/api/group_id.jpg)  
  
12.  If you want to message group WA via API use Group ID on Phone & make sure parameter isGroup=true

### Save Group Whatsapp Members Contact

1.  Make sure your device Connected & became Admin/member of Group Whatsapp.
2.  Activate Get Incoming Message on Device setting.
3.  Send message 'save', without ' ' from your phone or API to Group Whatsapp.
4.  Check Contact->Group on Wablas.

### Personalization Message (Call Wablass Data Contact)

1.  Please make sure you already add phone number, name, etc on Contact Person Wablas (via create Contact or Import Contact on Menu Phonebook -> Contact).
2.  If using API Add variable spintax = true on data body
3.  If you want call name & address you can use {name} & {address} on message.  
    Example :  
    **Data Contact**  
    **Phone** : 08111111111  
    **Nickname** : Celes256  
    **Name** : Celavina Celes  
    **Address** : Sirus Blackthorn, Sector Dragonfire Lane, Eldoria, Republic of Birthland  
      
    **Data Send**  
    **Receiver** : 08111111111  
    **Message Body** :  
    "Hello **_{nickname}_**, we have received your order on behalf of **_{name}_**, and we will promptly send it to your address: **_{address}_**. Thank you for choosing our store for your purchase."  
      
    **Message Sent** :  
    "Hello **Celes256**, we have received your order on behalf of **Celavina Celes**, and we will promptly send it to your address: **Sirus Blackthorn, Sector 5, Dragonfire Lane 5, Eldoria, Republic of Birthland**. Thank you for choosing our store for your purchase."
4.  List of avalaible variable:  
    {name} => string  
    {nickname} => string  
    {address} => string  
    {birthday} => date  
    {email} => email  
    {gender} => male/female  
    

### Send Message to Group

1.  Send Group Using API Simple Message
example : `https://bdg.wablas.com/api/send-message?phone={phone}&message={message}&token={token}&isGroup=true`

```php
<?php
$curl = curl_init();
$token = "";
$groupId = "123243242-asdaxxxx";
$message = "test get";
curl_setopt($curl, CURLOPT_URL, "https://bdg.wablas.com/api/send-message?phone=$phone&message=$message&token=$token&isGroup=true");
$result = curl_exec($curl);
curl_close($curl);

print_r($result);
?>
```

4.  Send Group Using API V1
Example :

```php
<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$data = [
    'phone' => '872468237asd-6281218xxxxxx',
    'message' => 'hello there',
    'isGroup' => 'true' //its string not boolean
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/send-message");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
$result = curl_exec($curl);
curl_close($curl);
print_r($result);
?>
```

6.  Send Group Using API V2
Example :

```php
<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$random = true;
$payload = [
    "data" => [
        [
            'phone' => '6281218444-87687324xxxxxx',
            'message' => 'hello there',
            'isGroup' => 'true'
        ],
        [
            'phone' => '6281218xxxxxx',
            'message' => 'hello there',
        ]
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/send-message");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
print_r($result);
?>
```

### Mention Member in WhatsApp Group

1.  You can use @number in the message body to mention members in the WhatsApp group.
example :

```php
<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$random = true;
$payload = [
    "data" => [
        [
            'phone' => '6281218444-87687324xxxxxx',
            'message' => 'Hello @0813939121212, congratulations on joining the group!',
            'isGroup' => 'true'
        ]
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/send-message");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
print_r($result);
?>
```

### Check Phone

Use to Check Whatsapp Number is active or not.

`GET https://phone.wablas.com/check-phone-number?phones={phones}`

```php

<?php
$phones = "6281393961320,62142312121";
$token = "";
$curl = curl_init();
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token",
        "url: https://bdg.wablas.com",
    )
);
curl_setopt($curl, CURLOPT_URL,  "https://phone.wablas.com/check-phone-number?phones=$phones");
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}

token

Required

token can be found in the menu: Device - Settings

url

Required

Host Service, use: https://bdg.wablas.com

phone

Required

Target phone number. You can use the country code prefix or not.

Response:

```javascript

{
    "status": "success",
    "data": [
        {
            "phone": "6281393961320",
            "status": "online"
        },
        {
            "phone": "62142312121",
            "status": "offline"
        }
    ],
    "message": "Success"
}
        
```

### Create WhatsApp Device

**Purpose:** Register a new WhatsApp device with Wablas API. This is the first step to start sending WhatsApp messages through our platform.

Before you can send WhatsApp messages, you need to create and register a device. This endpoint creates a new device instance and generates an invoice for the selected plan. After device creation, you'll need to scan a QR code to connect your WhatsApp account.

###### API Endpoint

`POST https://bdg.wablas.com/api/device/create`

###### PHP Example:

```php

<?php
// Initialize cURL session
$curl = curl_init();

// Your API credentials
$token = "your_api_token_here";
$secret_key = "your_secret_key_here";

// Device configuration data
$data = [
    'name' => 'My Business WhatsApp',      // Device display name
    'phone' => '6281218xxxxxx',           // WhatsApp phone number
    'bank' => 'BCA',                      // Payment method
    'periode' => 'monthly',               // Billing period
    'product' => 'lite'                   // Plan type
];

// Set up the API request headers
curl_setopt($curl, CURLOPT_HTTPHEADER, [
    "Authorization: $token.$secret_key",
]);

// Configure cURL options
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL, "https://bdg.wablas.com/api/device/create");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

// Execute the request
$result = curl_exec($curl);

// Check for errors
if(curl_errno($curl)) {
    echo 'Request failed: ' . curl_error($curl);
}

// Close cURL session
curl_close($curl);

// Display the result
echo "<pre>";
print_r($result);
echo "</pre>";
?>
```

###### Request Parameters:

Parameter

Type

Required

Description

`Authorization`

string

Required

Header containing your token and secret key in format: `{token}.{secret_key}`

`name`

string

Required

Display name for your device (e.g., "Business WhatsApp", "Support Line")

`phone`

string

Required

WhatsApp phone number in international format (e.g., 6281234567890)

`bank`

string

Required

Payment method: "BCA", "BNI", "BRI", "MANDIRI", "OVO", "DANA", "GOPAY", "SHOPEEPAY"

`product`

string

Required

Plan type: "lite", "pro", "enterprise" (see pricing for details)

`periode`

string

Optional

Billing period: "monthly", "yearly" (default: "monthly")

###### Success Response:

```javascript

{
    "status": true,
    "message": "create device & invoice successfully",
    "data": {
        "device_name": "My Business WhatsApp",
        "device": "55LVXO",
        "product": "Lite",
        "numberInvoice": "INVC3M7P9T",
        "periode": "monthly",
        "bank": {
            "bankName": "BANK BCA",
            "account_number": "0152939963",
            "account_name": "Muhamad Yanun As'at"
        },
        "discount": null,
        "total": 69039,
        "due_date": "2022-05-04"
    }
}
```

**Important Notes:**

*   The phone number must be a valid WhatsApp number that you can access.
*   You'll need to complete payment before the device becomes active.
*   After payment, you'll receive a QR code to scan with your WhatsApp app.
*   Each device can only be connected to one WhatsApp account at a time.

###### Response Fields

*   **device\_name:** The name you provided for the device
*   **device:** Unique device ID (save this for future API calls)
*   **product:** Selected plan type
*   **numberInvoice:** Invoice number for payment
*   **periode:** Billing period
*   **total:** Amount to pay (in IDR)
*   **due\_date:** Payment deadline

###### Next Steps

1.  Complete payment using the provided bank details
2.  Wait for payment confirmation (usually within 1-2 hours)
3.  Use the device ID to check device status
4.  Scan QR code when device is ready
5.  Start sending messages!

###### Available Plans

Plan

Features

Monthly Price

**Lite**

Basic messaging, 1 device

IDR 69,039

**Pro**

Advanced features, multiple devices

IDR 199,000

**Enterprise**

Full features, unlimited devices

Contact sales

**Pro Tip:** Choose a descriptive device name that helps you identify its purpose (e.g., "Customer Support", "Marketing Campaigns", "Order Notifications"). This will make it easier to manage multiple devices.

### Device Info

Info about your device detail, like quota, status, expired date, etc

`GET https://bdg.wablas.com/api/device/info`

```php

<?php
$curl = curl_init();
$token = "";
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/device/info?token=$token");
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

token

Required

token can be found in the menu: Device - Settings

###### Body Response:

serial

string

Unix ID for device

sender

string

Phone number for sender. You can use the country code prefix or not. example: 62821144818

name

string

sender name example: Peter

quota

string

quota device

expired\_date

string

expired date for device

status

string

connected or disconnected

active

boolean

true or false

Response:

```javascript

{
    "status": true,
    "data": {
        "name": "eko",
        "serial": "WYE9xx",
        "sender": "628122988xxxx",
        "quota": 91,
        "expired_date": "2022-04-08",
        "active": true, //true or false
        "status": "disconnected" //connected or disconnected
    }
}
        
```

### List Available Wablas Server

`GET https://bdg.wablas.com/api/list-server`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/list-server?token=$token.$secret_key");
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

Response:

```javascript

{
    "status": true,
    "message": "succesfuly get available wablas server",
    "server": [
        "kudus",
        "deu"
    ]
}
        
```

### Device Scan QR-Code

Generate new QR Code image

`GET https://bdg.wablas.com/api/device/scan?token=token`

###### Request parameters:

token

Required

token can be found in the menu: Device - Settings

Response:

[Image: No description](https://converturltomd.com/assets/images/qr-code.png)

##### Example

**HTML :**

```php
<a href="https://bdg.wablas.com/api/device/scan?token=your_token" target="_blank" >Scan QR Code</a>
        
```

### Change Device Number

`POST https://bdg.wablas.com/api/device/change-number`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$data = [
    'phone' => '6281218xxxxxx',
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/device/change-number");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

Phone

Required

New phone number for device. You can use the country code prefix or not.

Response:

```javascript

{
    "status": true,
    "message": "number successfully changed"
}
        
```

### Change Device Webhook URL

`POST https://bdg.wablas.com/api/device/change-webhook-url`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$data = [
    'webhook_url' => 'https://example.com',
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/device/change-webhook-url");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

webhook\_url

Required

New webhook URL for device.

Response:

```javascript

{
    "status": true,
    "message": "webhook url successfully changed"
}
        
```

### Change Device Tracking URL

`POST https://bdg.wablas.com/api/device/change-tracking-url`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$data = [
    'tracking_url' => 'https://example.com',
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/device/change-tracking-url");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

tracking\_url

Required

New tracking URL for device

Response:

```javascript

{
    "status": true,
    "message": "tracking url successfully changed"
}
        
```

### Change Device Closing

`POST https://bdg.wablas.com/api/device/change-closing`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$data = [
    'closing' => 'selamat pagi',
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/device/change-closing");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

closing

Required

New Closing message for device.

Response:

```javascript

{
    "status": true,
    "message": "closing message successfully changed"
}
        
```

### Generate Token Device

Generate new token for your device

`GET https://bdg.wablas.com/api/device/generate-token`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/device/generate-token");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

Response:

```javascript

{
    "status": true,
    "message": "token successfully changed",
    "data": {
        "device_name": "ilham",
        "device_serial": "5L4THK",
        "token": "4TFulblJWIhPz7WE5LmOYhsfH3ha6ArJFoY1cFmrJefYGG3G9cz8uvu2WR3Wn6Op"
    }
}
        
```

### Device Disconnect

Disconnect your device from server.

`GET https://bdg.wablas.com/api/device/disconnect`

```php

<?php
$curl = curl_init();
$token = "your_token";
$secret_key = "";
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/device/disconnect");
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

Response:

```javascript

{
    "status": true,
    "message": "your device {device_id} succesfully disconnected"
}
        
```

### Device Restart

Use to restart your device via API.

`GET https://bdg.wablas.com/api/device/restart`

```php

<?php
$curl = curl_init();
$token = "device_token";
$secret_key = "";
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/device/restart");
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

Response:

```javascript

{
    "status": true,
    "message": "restart device {device_id} successfully"
}
        
```

### Delete Device

Delete Expired Device

`DELETE https://bdg.wablas.com/api/device/delete`

```php

<?php
$curl = curl_init();
$token = "your_token";
$secret_key = "";
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/device/delete");
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "DELETE");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

Response:

```javascript

{
    "status": true,
    "message": "your device succesfully deleted"
}
        
```

### Change Device Speed (Delay Message)

Change speed device by set delay time (second) to send message per batch (5 messages) with min delay : 10s & max delay : 120s

`POST https://bdg.wablas.com/api/device/speed`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$data = [
    'delay' => '10',
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/device/speed");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

delay

Required

Set delay time (second) to send message per batch (5 messages) min: 10s max: 120s

Response:

```javascript

{
    "status": true,
    "data": {
        "deviceId": "{deviceID}",
        "message": "delay sending message per 5 messages set to {delay} second"
    }
}
        
```

### Send Simple Text Message

**Purpose:** Send a text message to a WhatsApp contact or group. This endpoint is perfect for sending notifications, alerts, or simple text-based communications.

This API endpoint allows you to send text messages to individual contacts or groups. Messages are queued for delivery and will be sent even if the recipient's phone is offline. This makes it ideal for sending important notifications, promotional messages, or any text-based communication.

###### API Endpoint

`GET https://bdg.wablas.com/api/send-message`

###### PHP Example:

```php

<?php
// Initialize cURL session
$curl = curl_init();

// Your API credentials
$token = "your_api_token_here";
$secret_key = "your_secret_key_here";

// Message details
$phone = "628122364xxxx";  // Recipient's phone number
$message = urlencode("Hello! This is a test message from Wablas API.");
$flag = "instant";  // Optional: Enable extended message processing

// Set up the API request
curl_setopt($curl, CURLOPT_URL, "https://bdg.wablas.com/api/send-message?token=$token.$secret_key&phone=$phone&message=$message&flag=$flag");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

// Execute the request
$result = curl_exec($curl);

// Check for errors
if(curl_errno($curl)) {
    echo 'Request failed: ' . curl_error($curl);
}

// Close cURL session
curl_close($curl);

// Display the result
echo "<pre>";
print_r($result);
echo "</pre>";
?>
```

###### Request Parameters:

Parameter

Type

Required

Description

`token`

string

Required

Your API authentication token. You can find this in your Wablas dashboard under API settings.

`secret_key`

string

Required

Your API secret key for additional security. This is also available in your dashboard.

`phone`

string

Required

Recipient's phone number in international format (e.g., 6281234567890). For groups, use the group ID.

`message`

string

Required

The text message you want to send. Use `urlencode()` for special characters.

`isGroup`

string

Optional

Set to "true" if sending to a group. Default is "false" for individual contacts.

`ref_id`

string

Optional

Custom reference ID for tracking your messages. Useful for integration with your systems.

`secret`

boolean

Optional

Set to true to send a disappearing message (24-hour expiry).

`retry`

integer

Optional

Number of retry attempts if message fails to send (default: 3).

`priority`

string

Optional

Message priority: "high", "normal", or "low". High priority messages are sent first.

`random`

boolean

Optional

Set to true to randomly select from available devices for load balancing.

`spintax`

boolean

Optional

Enable spintax processing for message variations. [See examples](#mention)

`source`

string

Optional

Source identifier for tracking message origin (e.g., "website", "app", "crm").

`flag`

string

Optional

Message processing flag. Set to `"instant"` to enable additional message processing and event publishing. Only messages with this flag will trigger extended processing workflows.

###### Success Response (Single Message):

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "messages": [
            {
                "id": "5be46e84-650c-4ba1-a1a6-5647d358c43a",
                "phone": "6281218xxxxxx",
                "message": "Hello! This is a test message.",
                "status": "pending"
            }
        ]
    }
}
```

###### Success Response (Multiple Devices):

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 97,
        "message": [
            {
                "id": "a8435a2e-f0a9-43ac-8f3e-816ec750796c",
                "phone": "628122364xxxx",
                "message": "Hello! This is a test message.",
                "status": "pending"
            }
        ]
    }
}
```

**Important Notes:**

*   Always use `urlencode()` for your message content to handle special characters properly.
*   Phone numbers should be in international format without the "+" symbol.
*   For group messages, set `isGroup=true` and use the group ID as the phone parameter.
*   Messages are queued and will be delivered even if the recipient is offline.
*   Use the `ref_id` parameter to track your messages in your own system.
*   Set `flag="instant"` to enable extended message processing and event publishing features.

###### Common Use Cases

*   **Customer Notifications:** Send order confirmations, shipping updates, or appointment reminders.
*   **Marketing Messages:** Send promotional offers, newsletters, or product announcements.
*   **Support Messages:** Send ticket updates, resolution confirmations, or follow-up messages.
*   **Group Announcements:** Send important updates to team groups or community chats.

### Single Send Text

`POST https://bdg.wablas.com/api/send-message`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$data = [
'phone' => '6281218xxxxxx',
'message' => 'hello there',
'flag' => 'instant',
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/send-message");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Target phone number. You can use the country code prefix or not. You can send to multiple number, use comma (,) to separate whatsapp number. example: 08238264xxxx,08238264xxxx,08238264xxxx

message

Required

Text message to be sent. Format: UTF-8 or UTF-16 string. maximum character is 1024.

isGroup

optional

Value is true if param phone is group ID.

ref\_id

optional

Value of transaction ID from client / sender.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

retry

optional

Message will be tried to be re-sent if previously failed to send.

priority

optional

If the value is true, The message is sent first from another message queue.

random

optional

If value TRUE & you have multiple active devices, it will sent message using randomly selected device you have.

spintax

optional

If the value is true, you can call/mention data on your contact wablas on your message. [Example](#mention)

source

optional

Message delivery grouping by source, like: blog, wordpress, fb, ig and others.

flag

optional

Message processing flag. Set to `"instant"` to enable additional message processing and event publishing. Only messages with this flag will trigger extended processing workflows.

Response For Single Sender:

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "messages": [
            {
                "id": "5be46e84-650c-4ba1-a1a6-5647d358c43a",
                "phone": "6281218xxxxxx",
                "message": "hello there",
                "status": "pending"
            }
        ]
    }
}
        
```

Response For Random Multiple Sender (random = true):

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": [
        {
            "device_id": "A5DOYJ",
            "quota": 97,
            "messages": {
                "id": "5be46e84-650c-4ba1-a1a6-5647d358c43a",
                "phone": "6281218xxxxxx",
                "message": "hello there",
                "status": "pending"
            }
        },
        {
            "device_id": "BK4L7G",
            "quota": 33,
            "message": {
                "id": "bh765a2e-f0a9-43ac-8f3e-816ec7506781",
                "phone": "628122123xxxx",
                "message": "test get 2",
                "status": "pending"
            }
        }
    ]
}
        
```

### Send Message OTP

**Purpose:** Send a instant OTP text message to a WhatsApp contact. This endpoint is perfect for sending OTP.

This API endpoint allows you to send text messages to individual contacts. Messages are send instantly perfect for sending OTP.

###### API Endpoint

`GET https://bdg.wablas.com/api/send-message`

###### PHP Example:

```php

<?php
// Initialize cURL session
$curl = curl_init();

// Your API credentials
$token = "your_api_token_here";
$secret_key = "your_secret_key_here";

// Message details
$phone = "628122364xxxx";  // Recipient's phone number
$message = urlencode("Hello! This is a test message from Wablas API.");
$flag = "instant";  // Optional: Enable extended message processing

// Set up the API request
curl_setopt($curl, CURLOPT_URL, "https://bdg.wablas.com/api/send-message?token=$token.$secret_key&phone=$phone&message=$message&flag=$flag");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

// Execute the request
$result = curl_exec($curl);

// Check for errors
if(curl_errno($curl)) {
    echo 'Request failed: ' . curl_error($curl);
}

// Close cURL session
curl_close($curl);

// Display the result
echo "<pre>";
print_r($result);
echo "</pre>";
?>
```

###### Request Parameters:

Parameter

Type

Required

Description

`token`

string

Required

Your API authentication token. You can find this in your Wablas dashboard under API settings.

`secret_key`

string

Required

Your API secret key for additional security. This is also available in your dashboard.

`phone`

string

Required

Recipient's phone number in international format (e.g., 6281234567890). For groups, use the group ID.

`message`

string

Required

The text message you want to send. Use `urlencode()` for special characters.

`isGroup`

string

Optional

Set to "true" if sending to a group. Default is "false" for individual contacts.

`ref_id`

string

Optional

Custom reference ID for tracking your messages. Useful for integration with your systems.

`secret`

boolean

Optional

Set to true to send a disappearing message (24-hour expiry).

`retry`

integer

Optional

Number of retry attempts if message fails to send (default: 3).

`priority`

string

Optional

Message priority: "high", "normal", or "low". High priority messages are sent first.

`random`

boolean

Optional

Set to true to randomly select from available devices for load balancing.

`spintax`

boolean

Optional

Enable spintax processing for message variations. [See examples](#mention)

`source`

string

Optional

Source identifier for tracking message origin (e.g., "website", "app", "crm").

`flag`

string

Optional

Message processing flag. Set to `"instant"` to enable additional message processing and event publishing. Only messages with this flag will trigger extended processing workflows.

###### Success Response (Single Message):

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "messages": [
            {
                "id": "5be46e84-650c-4ba1-a1a6-5647d358c43a",
                "phone": "6281218xxxxxx",
                "message": "Hello! This is a test message.",
                "status": "pending"
            }
        ]
    }
}
```

###### Success Response (Multiple Devices):

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 97,
        "message": [
            {
                "id": "a8435a2e-f0a9-43ac-8f3e-816ec750796c",
                "phone": "628122364xxxx",
                "message": "Hello! This is a test message.",
                "status": "pending"
            }
        ]
    }
}
```

**Important Notes:**

*   Always use `urlencode()` for your message content to handle special characters properly.
*   Phone numbers should be in international format without the "+" symbol.
*   For group messages, set `isGroup=true` and use the group ID as the phone parameter.
*   Messages are queued and will be delivered even if the recipient is offline.
*   Use the `ref_id` parameter to track your messages in your own system.
*   Set `flag="instant"` to enable extended message processing and event publishing features.

### Single Send Image

`POST https://bdg.wablas.com/api/send-image`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$data = [
'phone' => '6281218xxxxxx',
'image' => 'https://cdn-asset.jawapos.com/wp-content/uploads/2019/01/keluarga-pawang-di-jepang-maafkan-macan-putih-yang-membunuhnya_m_.jpg',
'caption' => 'tes',
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/send-image");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Target phone number. You can use the country code prefix or not. You can send to multiple number, use comma (,) to separate whatsapp number. example: 08238264xxxx,08238264xxxx,08238264xxxx

image

Required

URL of image file to be sent. Make sure the image has been uploaded on the server and can be accessed by the public. Extention Support : jpg, jpeg, png. Max Size : 2MB.

caption

Optional

Text message to be sent. Format: UTF-8 or UTF-16 string. maximum character is 1024.

isGroup

optional

Value is true if param phone is group ID.

ref\_id

optional

Value of transaction ID from client / sender.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

retry

optional

Message will be tried to be re-sent if previously failed to send.

priority

optional

If the value is true, The message is sent first from another message queue.

spintax

optional

If the value is true, you can call/mention data on your contact wablas on your message. [Example](#mention)

random

optional

If value TRUE & you have multiple active devices, it will sent message using randomly selected device you have.

Response For Single Sender:

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 94,
        "messages": [
            {
                "id": "9a983307-3b79-4cd7-b2e7-f3590dcf2283",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "tes",
                "image": "6e0c82ef31d7048ded6650a9c9f64e70.jpeg",
                "status": "pending"
            }
        ]
    }
}
        
```

Response For Random Multiple Sender (random = true):

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": [
        {
            "device_id": "A5DOYJ",
            "quota": 97,
            "messages": {
                "id": "9a983307-3b79-4cd7-b2e7-f3590dcf2283",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "tes 1",
                "image": "exampleImage1.jpeg",
                "status": "pending"
            }
        },
        {
            "device_id": "BK4L7G",
            "quota": 33,
            "message": {
                "id": "789833u7-3b514-4cd7-6754-f3590dcfbg67",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "tes 2",
                "image": "exampleImage2.jpeg",
                "status": "pending"
            }
        }
    ]
}
        
```

### Send Image from Local

_File Extension: jpg, jpeg, png, gif. Max size : 2MB.'_

`POST https://bdg.wablas.com/api/send-image-from-local`

```php
<?php
$token = "";
$secret_key = "";
$filename = $_FILES['upload_file']['tmp_name'];
$handle = fopen($filename, "r");
$file = fread($handle, filesize($filename));

$params = [
    'phone' => '081XXXXXXX',
    'caption' => 'hi', // can be null
    'file' => base64_encode($file),
    'data' => json_encode($_FILES['upload_file'])
];

/**
 * bulk message
$params = [
    'phone' => '081XXXXXX91,0850011xxx',
    'caption' => 'hi', // can be null
    'file' => base64_encode($file),
    'data' => json_encode($_FILES['upload_file'])
];
 */

$curl = curl_init();
curl_setopt($curl, CURLOPT_HTTPHEADER, [ "Authorization: $token.$secret_key" ] );
curl_setopt($curl, CURLOPT_URL, "https://bdg.wablas.com/api/send-image-from-local");
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($params));
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
$result = curl_exec($curl);
curl_close($curl);

echo "<pre>";
print_r($result);
?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Target phone number. You can use the country code prefix or not. You can send to multiple number, use comma (,) to separate whatsapp number. example: 08238264xxxx,08238264xxxx,08238264xxxx

caption

Optional

Text message to be sent. Format: UTF-8 or UTF-16 string. maximum character is 1024.

isGroup

optional

Value is true if param phone is group ID.

ref\_id

optional

Value of transaction ID from client / sender.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

filename

optional

Specify a custom filename for the file (max 60 Char.).

retry

optional

Message will be tried to be re-sent if previously failed to send.

Response

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 94,
        "messages": [
            {
                "id": "9a983307-3b79-4cd7-b2e7-f3590dcf2283",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "tes",
                "image": "6e0c82ef31d7048ded6650a9c9f64e70.jpeg",
                "status": "pending"
            }
        ]
    }
}
        
```

### Single Send Document

`POST https://bdg.wablas.com/api/send-document`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$data = [
'phone' => '6281218xxxxxx',
'document' => 'https://pdfobject.com/pdf/sample.pdf',
'caption' => 'caption',
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/send-document");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Target phone number. You can use the country code prefix or not. You can send to multiple number, use comma (,) to separate whatsapp number. example: 08238264xxxx,08238264xxxx,08238264xxxx

caption

Optional

name of document

document

Required

The document file URL to be sent. Make sure documents have been uploaded on the server and can be accessed by the public. Extention Support: doc, docx, pdf, odt, csv, ppt, pptx, xls, xlsx, txt.

isGroup

optional

Value is true if param phone is group ID.

ref\_id

optional

Value of transaction ID from client / sender.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

retry

optional

Message will be tried to be re-sent if previously failed to send.

spintax

optional

If the value is "true", you can call/mention data on your contact wablas on your message. Example {name}, {address}, etc

priority

optional

If the value is true, The message is sent first from another message queue.

random

optional

If value TRUE & you have multiple active devices, it will sent message using randomly selected device you have.

Response For Single Sender:

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 92,
        "messages": [
            {
                "id": "3f96d90f-8379-466f-ad7e-9f18e306822e",
                "phone": "62812182345632",
                "message": null,
                "caption": "document",
                "document": "sample.pdf",
                "status": "pending"
            }
        ]
    }
}
        
```

Response For Random Multiple Sender (random = true):

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": [
        {
            "device_id": "A5DOYJ",
            "quota": 91217,
            "messages": {
                "id": "9a983307-3b79-4cd7-b2e7-f3590dcf2283",
                "phone": "62812182345632",
                "message": null,
                "caption": "document",
                "document": "sample 1.pdf",
                "status": "pending"
            }
        },
        {
            "device_id": "BK4L7G",
            "quota": unlimited,
            "message": {
                "id": "789833u7-3b514-4cd7-6754-f3590dcfbg67",
                "phone": "62812182345632",
                "message": null,
                "caption": "document",
                "document": "sample 2.pdf",
                "status": "pending"
            }
        }
    ]
}
        
```

### Send Document from Local

_File Extension: doc, docx, pdf, odt, csv, ppt, pptx, xls, xlsx, txt. Max size : 2MB.'_

`POST https://bdg.wablas.com/api/send-document-from-local`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$filename = $_FILES['upload_file']['tmp_name'];
$handle = fopen($filename,"r");
$file = fread($handle,filesize($filename));
$data = [
    'phone' => '6281218xxxxxx',
    'file' => base64_encode($file),
    'data' => json_encode($_FILES['upload_file'])
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/send-document-from-local");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

##### File from local Path

```php
<?php
$file = '/path/to/your_pdf_file.pdf';

$data = [
    'phone' => '6281393961320',
    'file' => base64_encode(file_get_contents($file)),
    'data' => json_encode(['name' => 'your_pdf_file.pdf'])
];

$token = 'YOUR_TOKEN'; // Replace with your actual authorization token
$secret_key = 'YOUR_SECRET_KEY'
$url = 'm/api/send-document-from-local';

$ch = curl_init();

$headers = [
    'Authorization: ' . $token.'.'.$secrey_kry,
];

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);

$response = curl_exec($ch);

curl_close($ch);

$result = $response;
print_r($result);
?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Target phone number. You can use the country code prefix or not. You can send to multiple number, use comma (,) to separate whatsapp number. example: 08238264xxxx,08238264xxxx,08238264xxxx

isGroup

optional

Value is true if param phone is group ID.

ref\_id

optional

Value of transaction ID from client / sender.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

retry

optional

Message will be tried to be re-sent if previously failed to send.

name\_file

optional

Name of the file to be sent, for example: Presentation. Use this if you don't want your file name to be generated as a new name.

Response For Single Sender:

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 92,
        "messages": [
            {
                "id": "3f96d90f-8379-466f-ad7e-9f18e306822e",
                "phone": "62812182345632",
                "message": null,
                "caption": "document",
                "document": "sample.pdf",
                "status": "pending"
            }
        ]
    }
}
        
```

### Single Send Video

`POST https://bdg.wablas.com/api/send-video`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$data =  [
'phone' => '6281218xxxxxx',
'video' => 'https://filesamples.com/samples/video/mp4/sample_960x540.mp4',
'caption' => 'tes',
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/send-video");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Target phone number. You can use the country code prefix or not. You can send to multiple number, use comma (,) to separate whatsapp number. example: 08238264xxxx,08238264xxxx,08238264xxxx

video

Required

Video URL file to be sent. Make sure the video has been uploaded on the server and is publicly accessible. Extention Support: mp4,mpeg.

caption

Optional

Text message to be sent. Format: UTF-8 or UTF-16 string. maximum character is 1024.

isGroup

optional

Value is true if param phone is group ID.

ref\_id

optional

Value of transaction ID from client / sender.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

retry

optional

Message will be tried to be re-sent if previously failed to send.

priority

optional

If the value is true, The message is sent first from another message queue.

random

optional

If value TRUE & you have multiple active devices, it will sent message using randomly selected device you have.

Response For Single Sender:

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 94,
        "messages": [
            {
                "id": "9a983307-3b79-4cd7-b2e7-f3590dcf2283",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "tes",
                "video": "sample_960x540.mp4",
                "status": "pending"
            }
        ]
    }
}
        
```

Response For Random Multiple Sender (random = true):

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": [
        {
            "device_id": "A5DOYJ",
            "quota": 97,
            "messages": {
                "id": "9a983307-3b79-4cd7-b2e7-f3590dcf2283",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "tes video",
                "video": "sample_960x540.mp4",
                "status": "pending"
            }
        },
        {
            "device_id": "BK4L7G",
            "quota": 33,
            "message": {
                "id": "9a983307-3b79-4cd7-b2e7-f3590dcf2283",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "tes video 2",
                "video": "sample_960x540.mp4",
                "status": "pending""
            }
        }
    ]
}
        
```

### Send Video from Local

_File Extension: mp4,mpeg. Max size : 2MB.'_

`POST https://bdg.wablas.com/api/send-video-from-local`

```php

<?php
$file = $_FILES['file']['tmp_name'];
$mime = $_FILES['file']['type'];
$name = $_FILES['file']['name'];
$video = new \CURLFile($file,$mime,$name);
$data = [
    'phone' => '6281218xxxxxx',
    'caption' => 'tes',
    'file' => $video
];

$curl = curl_init();
$token = "";
$secret_key = "";
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS,$data);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/send-video-from-local");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Target phone number. You can use the country code prefix or not. You can send to multiple number, use comma (,) to separate whatsapp number. example: 08238264xxxx,08238264xxxx,08238264xxxx

file

Required

Video URL file to be sent. Make sure the video has been uploaded on the server and is publicly accessible. Extention Support: mp4,mpeg.

caption

Optional

Text message to be sent. Format: UTF-8 or UTF-16 string. maximum character is 1024.

isGroup

optional

Value is true if param phone is group ID.

ref\_id

optional

Value of transaction ID from client / sender.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

retry

optional

Message will be tried to be re-sent if previously failed to send.

Response

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 94,
        "messages": [
            {
                "id": "9a983307-3b79-4cd7-b2e7-f3590dcf2283",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "tes",
                "video": "sample_960x540.mp4",
                "status": "pending"
            }
        ]
    }
}
        
```

### Single Send Audio

`POST https://bdg.wablas.com/api/send-audio`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$data = [
'phone' => '6281218xxxxxx',
'audio' => 'https://download.samplelib.com/mp3/sample-6s.mp3',
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/send-audio");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Target phone number. You can use the country code prefix or not. You can send to multiple number, use comma (,) to separate whatsapp number. example: 08238264xxxx,08238264xxxx,08238264xxxx

audio

Required

URL of audio file to be sent. Make sure the audio has been uploaded on the server and can be accessed by the public. Extention Support : mp3,ogg,mpga. Max Size: 2MB.

isGroup

optional

Value is true if param phone is group ID.

ref\_id

optional

Value of transaction ID from client / sender.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

retry

optional

Message will be tried to be re-sent if previously failed to send.

priority

optional

If the value is true, The message is sent first from another message queue.

random

optional

If value TRUE & you have multiple active devices, it will sent message using randomly selected device you have.

Response For Single Sender:

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "device_id": "A0HDJU",
        "quota": "unlimited",
        "messages": [
            {
                "id": "a1787d18-1176-484f-a39d-bf02ed77a4d2",
                "phone": "6281229889541",
                "message": null,
                "caption": "audio",
                "audio": "file_example_MP3_700KB.mp3",
                "status": "pending",
                "ref_id": null
            }
        ]
    }
}
        
```

Response For Random Multiple Sender (random = true):

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": [
        {
            "device_id": "A5DOYJ",
            "quota": 97,
            "messages": {
                "id": "9a983307-3b79-4cd7-b2e7-f3590dcf2283",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "audio",
                "audio": "file_example_MP3_700KB.mp3",
                "status": "pending"
            }
        },
        {
            "device_id": "BK4L7G",
            "quota": 33,
            "message": {
                "id": "789833u7-3b514-4cd7-6754-f3590dcfbg67",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "audio",
                "audio": "file_example_MP3_700KB.mp3",
                "status": "pending"
            }
        }
    ]
}
        
```

### Send Audio from Local

_File Extension: mp3, ogg, mpga. Max Size: 2MB_

`POST https://bdg.wablas.com/api/send-audio-from-local`

```php

<?php
$file = $_FILES['file']['tmp_name'];
$mime = $_FILES['file']['type'];
$name = $_FILES['file']['name'];
$audio = new CURLFile($file,$mime,$name);
$data = [
    'phone' => '6281218xxxxxx',
    'file' => $audio
];

$curl = curl_init();
$token = "";
$secret_key = "";
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS,$data);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/send-audio-from-local");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Target phone number. You can use the country code prefix or not. You can send to multiple number, use comma (,) to separate whatsapp number. example: 08238264xxxx,08238264xxxx,08238264xxxx

isGroup

optional

Value is true if param phone is group ID.

ref\_id

optional

Value of transaction ID from client / sender.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

retry

optional

Message will be tried to be re-sent if previously failed to send.

Response

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 94,
        "messages": [
            {
                "id": "9a983307-3b79-4cd7-b2e7-f3590dcf2283",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "audio",
                "audio": "file_example_MP3_700KB.mp3",
                "status": "pending"
            }
        ]
    }
}
        
```

### Report Message

`GET https://bdg.wablas.com/api/report/message`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$message_id = "2bbdb474-1726-46ba-a9f2-bc29f9ff9f45";
$type = "text";
$date = "2022-04-11";
$perPage = "100";
$phone = "081229xxxxxx";
$page = "5";

curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/report/message?date=$date&perPage=$perPage&phone=$phone&page=$page");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Optional

Report displayed based on phone number

device

Optional

Input the serial number of the device you have on the same server as the device token. By default, it reports the device according to the token. Input "all" to check reports for all of your devices on that server.

perPage

Optional

Total of report displayed in one page. example: 10

ref\_id

optional

Value of transaction ID from client / sender.

page

Optional

Target page report. example: 1

status

Optional

status message : pending, cancel, read, sent

date

Optional

Report displayed based on date message. Example: 2022-04-1

message\_id

Optional

Reports displayed based on message id

text

Optional

Search and filter messages containing the specified text (not case sensitive, partial match is allowed)

type

Optional

Reports displayed based on category. Support Type: text, image, document, video, audio, button, template, location

Response:

```javascript

{
    "status": true,
    "totalData": 1,
    "perPage": "100",
    "page": "1",
    "totalPage": 1,
    "message": [
        {
            "id": "f6faac15-d6ab-42b4-8fd2-95e83c232dab",
            "phone": {
                "from": "6285867765107",
                "to": "6281393961320"
            },
            "category": "text",
            "text": "hello",
            "URL_file": null,
            "status": "sent",
            "type": "agent",
            "ref_id" : "pengumuman"
            "date": {
                "created_at": "2022-04-11 07:07:37",
                "updated_at": "2022-04-11 07:07:37"
            }
        }
    ]
}
        
```

### Report Realtime

Report of messages sent from the device Today

`GET https://bdg.wablas.com/api/report-realtime`

```php

<?php
$curl = curl_init();
$token = "";
\$secret_key = "";
$page = "";
$limit = "";
$message_id = "";
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/report-realtime?page=$page&message_id=$message_id&limit=$limit");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

limit

Optional

Total of report displayed in one page. example: 10. max input: 1000

page

Optional

Target page report. example: 1

Message\_id

Optional

Reports displayed based on message id. Multiple id seprated by comma(,). Example: f6faac15-d6ab-42b4-8fd2-95e83c232dab,ngh65c15-dv45b-41b4-8fd2-95e83c23u76gds

Response:

```javascript

{
    "status": true,
    "message": "success, report only today",
    "device_id": "6KU5L",
    "page": "1",
    "totalPage": 1,
    "totalData": 2,
    "message": [
        {
            "id": "f6faac15-d6ab-42b4-8fd2-95e83c232dab",
            "phone": {
                "from": "6285867765107",
                "to": "6281393961320"
            },
            "message": "hello",
            "file": null,
            "status": "sent",
            "category": "text",
            "type": "agent",
            "date": {
                "created_at": "2022-04-11 07:07:37",
                "updated_at": "2022-04-11 07:07:37"
            }
        },
        {
            "id": "ngh65c15-dv45b-41b4-8fd2-95e83c23u76gds",
            "phone": {
                "from": "6285867765107",
                "to": "6281393961321"
            },
            "message": "send image kaka",
            "file": {url image },
            "status": "pending",
            "category": "image",
            "type": "agent",
            "date": {
                "created_at": "2022-04-11 07:09:37",
                "updated_at": "2022-04-11 07:09:37"
            }
        }
    ]
}
        
```

### Create Single Agent

`POST https://bdg.wablas.com/api/create-agent`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$data = [
    'name' => 'danu',
    'phone' => '6281218xxxxxx',
    'email' => '[email protected]',
    'password' => 'xxxxxxxx',
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/create-agent");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Phone number agent. You can use the country code prefix or not

name

Required

Name

email

Required

Email

password

Required

Password

Response:

```javascript

{
    "status": true,
    "message": "Create Agent Success",
    "data": {
        "Total Agent": 8,
        "Remaining Slot": 16
    },
    "Info Agent": [
        {
            "name": "Harsoyo",
            "email": "[email protected]",
            "phone": "628139396132301"
        }
    ]
}
        
```

### Assign Agent to Chat

`POST https://bdg.wablas.com/api/assign-agent`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$data = [
    'phone' => '6281218xxxxxx',
    'email' => '[email protected]',
    'message_id' => 'xxxxxxxx',
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/assign-agent");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Agent's Phone/Whatsapp Number

email

Required

Agent's email

message\_id

Required

Message\_id of the chat to be assigned to the agent

Response:

```javascript

{
    "status": true,
    "message": "Message from phone 628139396xxxx succesfully assigned to agent XXX"
}
        
```

### {{ \_\_('Close Ticket by Phone') }}

{{ \_\_('Close ticket by whatsapp phone number') }}

`GET {{$host}}/api/cloce-ticket/{phone}`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$phone => '6281393xxxx',
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL,  "{{$host}}/api/close-ticket/$phone");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

{{ \_\_('documentation/translate.api.req.token-i') }}

secret\_key

Required

{{ \_\_('documentation/translate.api.req.token-ii') }}

phone

Required

{{ \_\_('whatsapp phone number of ticket') }}td>

Response:

```javascript

{
    "status": true,
    "message": "ticket for 6281393961320 successfully closed"
}
        
```

### Create Schedule

`POST https://bdg.wablas.com/api/schedule`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$data = [
    'phone' => '6281218xxxxxx',
    'date' => '2022-05-20',
    'time' => '13:20:00',
    'timezone' => 'Asia/Jakarta',
    'message' => 'hello',
    'isGroup' => 'true',
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/schedule");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Target phone number. You can use the country code prefix or not. You can send to multiple number, use comma (,) to separate whatsapp number. example: 08238264xxxx,08238264xxxx,08238264xxxx

message

Required

Text message to be sent. Format: UTF-8 or UTF-16 string. maximum character is 1024.

date

Required

The date the message will be sent. date format yyyy-mm-dd.

time

Required

The time the message will be sent, time format hh:ii:ss.

timezone

Required

Timezone for determine time. example: Asia/Jakarta.

isGroup

optional

Value is true if param phone is group ID.

random

optional

If value TRUE & you have multiple active devices, it will sent message using randomly selected device you have.

Response:

```javascript

{
    "status": true,
    "category": "text",
    "message": "Scheduled Messages is succesfully saved and waiting to be processed",
    "phones list": [
        "0876564546565"
    ],
    "messages": [
        {
            "id": "8d554adc-7279-4864-adbd-7407e47e6b9d",
            "phone": "62876564546565",
            "message": "text",
            "status": true,
            "timezone": "Asia/Jakarta",
            "schedule_at": "2022-05-20 13:20:00"
        }
    ]
}
        
```

Response using Random Device:

```javascript

{
    "status": true,
    "category": "text",
    "message": "Scheduled Messages is succesfully saved and waiting to be processed",
    "phones list": [
        "0876564546565",
        "08123142121",
        "0876646412",
        "08766464121",
        "0876646413",
        "0876646418"
    ],
    "messages": [
        {
            "device_id": "QAMU17",
            "quota": 78,
            "id": "d9b3534c-3d40-486d-8836-bafa846ed697",
            "phone": "62876564546565",
            "message": "text",
            "status": true,
            "timezone": "Asia/Jakarta",
            "schedule_at": "2022-05-20 13:20:00"
        },
        {
            "device_id": "JWLU43",
            "quota": 29,
            "id": "3a9ec1c3-f973-4cbe-87f1-738ffa41adfb",
            "phone": "628123142121",
            "message": "text",
            "status": true,
            "timezone": "Asia/Jakarta",
            "schedule_at": "2022-05-20 13:20:00"
        },
        {
            "device_id": "YFUM57",
            "quota": 74,
            "id": "c783204d-12d6-4e9d-b185-fed9a7149716",
            "phone": "62876646412",
            "message": "text",
            "status": true,
            "timezone": "Asia/Jakarta",
            "schedule_at": "2022-05-20 13:20:00"
        },
        {
            "device_id": "QAMU17",
            "quota": 77,
            "id": "8f85db3d-d88d-4689-943f-b1a799ce2f3e",
            "phone": "628766464121",
            "message": "text",
            "status": true,
            "timezone": "Asia/Jakarta",
            "schedule_at": "2022-05-20 13:20:00"
        },
        {
            "device_id": "7V98RO",
            "quota": 79,
            "id": "31a2cabb-e57e-4fb3-b298-0c92c20d594b",
            "phone": "62876646413",
            "message": "text",
            "status": true,
            "timezone": "Asia/Jakarta",
            "schedule_at": "2022-05-20 13:20:00"
        },
        {
            "device_id": "YFUM57",
            "quota": 73,
            "id": "5fbf625b-1187-46ba-8b95-d26212b0acc1",
            "phone": "62876646418",
            "message": "text",
            "status": true,
            "timezone": "Asia/Jakarta",
            "schedule_at": "2022-05-20 13:20:00"
        }
    ]
}
        
```

### Update Schedule

`PUT https://bdg.wablas.com/api/schedule/{schedule_id}`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$data = [
    'phone' => '6281218xxxxxx',
    'date' => '2022-05-20',
    'time' => '13:20:00',
    'timezone' => 'Asia/Jakarta',
    'message' => 'hello',
    'isGroup' => 'true',
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "PUT");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/schedule/{schedule_id}");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

{schedule\_id}

Required

Unix ID from schedule message. Look response documentation api send schedule. Example: 8abe5c56-7f43-451b-8b2d-91a9f9a74561

phone

Required

Target phone number. You can use the country code prefix or not. You can send to multiple number, use comma (,) to separate whatsapp number. example: 08238264xxxx,08238264xxxx,08238264xxxx

message

Required

Text message to be sent. Format: UTF-8 or UTF-16 string. maximum character is 1024.

date

Required

The date the message will be sent. date format yyyy-mm-dd.

time

Required

The time the message will be sent, time format hh:ii:ss.

timezone

Required

Timezone for determine time. example: Asia/Jakarta.

isGroup

optional

Value is true if param phone is group ID.

Response:

```javascript

{
    "status": true,
    "id": "8abe5c56-7f43-451b-8b2d-91a9f9a74561",
    "category": "text",
    "message": "Scheduled Messages is succesfully saved and waiting to be processed",
    "timezone": "Asia/Jakarta",
    "schedule_at": "2022-04-18 14:20:00",
    "device": {
        "serial": "WYE9PB",
        "name": "eko teguh wahyudi"
    },
    "phones list": [
        "0879599765999",
        "08232131223"
    ],
    "messages": "test"
}
        
```

### Cancel Schedule

`PUT https://bdg.wablas.com/api/schedule-cancel/{schedule_id}`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "PUT");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/schedule-cancel/{schedule_id}");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

{schedule\_id}

Required

Unix ID from schedule message. Look response documentation api send schedule. Example: 8abe5c56-7f43-451b-8b2d-91a9f9a74561

Response:

```javascript

{
    "status": true,
    "message" : "schedule canceled successfully",
}
        
```

### Delete Schedule

`DELETE https://bdg.wablas.com/api/schedule/{schedule_id}`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "DELETE");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/schedule/{schedule_id}");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

{schedule\_id}

Required

Unix ID from schedule message. Look response documentation api send schedule. Example: 8abe5c56-7f43-451b-8b2d-91a9f9a74561

Response:

```javascript

{
    "status": true,
    "message" : "schedule deleted successfully",
}
        
```

### Group Contact Wablas

Create Group Contact Wablas & Add Phones to Group

`POST https://bdg.wablas.com/api/group/add`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$data = [
'name' => 'Nama Group Kontak',
'phone' => '0814393939121,0814393939122,0814393939123',
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/group/add");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

name

Required

Group name you want to create or update

phone

Required

Phone number you want to add to group. You can use the country code prefix or not. to add multiple number, use comma (,) to separate whatsapp number. example: 08238264xxxx,08238264xxxx,08238264xxxx

Response:

```javascript

{
    "status": true,
    "message": "Update Group Contact AlexaGroup Succesfully",
    "data": [
        {
            "info": "08143939391225 succesfully add to group AlexaGroup",
            "status": true
        },
        {
            "info": "0814393939122 already add to group AlexaGroup",
            "status": true
        },
        {
            "phone": "adsasdasdas",
            "message": "format phone invalid",
            "status": false
        }
    ]
}
        
```

### Delete Contact From Wablas Group Contact

Remove/Delete Contact from Wablas Grup Contact

`POST https://bdg.wablas.com/api/group/delete-phone`

```php
<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$data = [
'name' => 'Mistimic',
'phone' => '6281223645055,6281229889541',
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://0e4e-103-107-71-208.ap.ngrok.io/api/group/delete-phone");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
$result = curl_exec($curl);
curl_close($curl);
print_r($result);
?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

name

Required

Group Name of Contact that you want to delete.

phone

Required

Phone number you want to remove/delete from group. You can use the country code prefix or not. to remove multiple number, use comma (,) to separate whatsapp number. example: 08238264xxxx,08238264xxxx,08238264xxxx

Response:

```javascript

{
    "status": true,
    "message": "remove phones number from group Mistimic",
    "data": [
        {
            "info": "6281223645055 succesfully removed from group Mistimic",
            "status": true
        },
        {
            "info": "6281229889541 not found on group Mistimic",
            "status": false
        }
    ]
}
        
```

### Blacklist Number

`GET https://bdg.wablas.com/api/blacklist?token=xxx&phone=xxxx`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$phone = "628122364xxxx";
curl_setopt($curl, CURLOPT_URL, "https://bdg.wablas.com/api/blacklist?token=$token&phone=$phone");
$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Phone number you want to add to blacklist

Response:

```javascript

{
    "status": true,
    "message": "Add 628122364xxxx to blacklist succesfully"
}
        
```

### Cancel Blacklist

`GET https://bdg.wablas.com/api/blacklist/cancel?token=xxx&phone=xxxx`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$phone = "628122364xxxx";
curl_setopt($curl, CURLOPT_URL, "https://bdg.wablas.com/api/blacklist/cancel?token=$token.$secret_key&phone=$phone");
$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Phone number you want to cancel from blacklist

Response:

```javascript

{
    "status": true,
    "message": "sucessfully cancel 628122364xxxx from blacklist"
}
        
```

### Resend Message By ID

`GET https://bdg.wablas.com/api/resend-message?id={id}`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$id = '471289fc-9c4c-46fe-bd26-5b2553a56fb7',
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/resend-message?id=$id");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

{id}

Required

unix ID from message. look response documentation api send message. You can use sign (,) if want to send more than one message. example:8abe5c56-7f43-451b-8b2d-91a9f9a74561,8abe5c56-7f43-451b-8b2d-91a9f9a74561

Response:

```javascript

{
    "status": true,
    "message": "Resend Message is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 655,
        "messages": [
            {
                "id": "471289fc-9c4c-46fe-bd26-5b2553a56fb7",
                "phone": "6281393961320",
                "message": "Merubah kesempatan",
                "status": "pending"
            }
        ]
    }
}
        
```

### Cancel Pending Message By ID

Cancel Pending message by ID.

`GET https://bdg.wablas.com/api/cancel-message?id={id}`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$id => '471289fc-9c4c-46fe-bd26-5b2553a56fb7',
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/cancel-message&id=$id");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

id

Required

unix ID from message. look response documentation api send message. You can use sign (,) if want to send more than one message. example:8abe5c56-7f43-451b-8b2d-91a9f9a74561,8abe5c56-7f43-451b-8b2d-91a9f9a74561td>

Response:

```javascript

{
    "status": true,
    "message": "Message is canceled and waiting to be processed",
    "data": {
        "messages": [
            {
                "id": "0c9e703d-a7ea-409a-b12b-8e9679f32ea7",
                "phone": "628135353565",
                "message": "Hello there",
                "status": "cancel"
            },
            {
                "message": "Id Invalid or message is not pending anymore",
                "status": false
            },
            {
                "id": "99c9b1a3-488e-41b6-9811-5a2c00865e58",
                "phone": "62812323232316",
                "message": "asfasfasfas asdasdasd asdasd",
                "status": "cancel"
            }
        ]
    }
}
        
```

### Cancel All Pending Messages

Cancel All Pending message.

`GET https://bdg.wablas.com/api/cancel-all-message`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/cancel-all-message");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

Response:

```javascript

        {
    "status": true,
    "message": "Cancel 3 pending messages",
    "data": {
        "messages": [
            {
                "id": "0c9e703d-a7ea-409a-b12b-8e9679f3xxxxx"
            },
            {
                "id": "99c9b1a3-488e-41b6-9811-5a2c008xxxxx"
            },
            {
                "id": "99c9b1a3-488e-41b6-9811-5a2c008xxxxx"
            }
        ]
    }
}
        
```

### Revoke Message By ID

`GET https://bdg.wablas.com/api/revoke-message?id={id}`

Delete Whatapp message that already sent  

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$id => '471289fc-9c4c-46fe-bd26-5b2553a56fb7',
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/revoke-message?id=$id");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

id

Required

unix ID from message. look response documentation api send message. You can use sign (,) if want to send more than one message. example:8abe5c56-7f43-451b-8b2d-91a9f9a74561,8abe5c56-7f43-451b-8b2d-91a9f9a74561

Response:

```javascript

        {
    "status": true,
    "message": "Message is being deleted and waiting to be processed",
    "data": {
        "messages": [
            {
                "id": "0c9e703d-a7ea-409a-b12b-8e9679f32ea7",
                "phone": "628135353565",
                "message": "{\"buttons\":[\"reply 1\",\"reply 2\",\"reply 3\"],\"content\":\"weq wqe  wqe  wqe q\",\"footer\":\"wqeqwwqe we we wq\"}",
                "status": "revoke"
            },
            {
                "id": "99c9b1a3-488e-41b6-9811-5a2c00865e59",
                "phone": "62812323232316",
                "message": "{\"buttons\":[\"reply 1sdf\",\"sdfsdafsdfsdf\",\"asdfsdafsdaf\"],\"content\":\"we4rfgdsafsdsdf\",\"footer\":\"sdfsdafsadf\"}",
                "status": "revoke"
            },
            {
                "id": "99c9b1a3-488e-41b6-9811-5a2c00865e58",
                "phone": "62812323232316",
                "message": "asfasfasfas asdasdasd asdasd",
                "status": "revoke"
            }
        ]
    }
}
        
```

### Upload File to Server Wablas

`POST https://bdg.wablas.com/api/upload/{type}`

```php

<?php
$type = 'image'; //type = document,image,audio,video;
$file = $_FILES['file']['tmp_name'];
$mime = $_FILES['file']['type'];
$name = $_FILES['file']['name'];
$data = new \CURLFile($file,$mime,$name);

$curl = curl_init();
$token = "";
$secret_key = "";
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, array('file'=>$data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/upload/$type");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

Type

Required

Type of file that you upload : image,video,audio,document (max size: 2 MB).

File

Required

File you want to upload, Example above use simple input file using PHP CURL > 5.

Response

```javascript

{
    "status": true,
    "message": "Upload file successfully",
    "data": {
        "messages": [
            {
                "url": "https://bdg.wablas.com/$type/$filename",
            }
        ]
    }
}
        
```

### Create Reminder

`POST https://bdg.wablas.com/api/reminder`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$data = [
    'phone' => '6281218xxxxxx',
    'start_date' => '2025-05-20 13:20:00', //YYYY-MM-dd format H:i:S
    'message' => 'Reminder message for you',
    'periode' => 'custom', //daily, mothly, yearly, custom
    'title' => 'New Reminder',//optional
    'custom_day' => '5,//if periode custom , required value 1-1000
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/reminder");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Target phone number for reminder message.

message

Required

Text message to be sent. Format: UTF-8 or UTF-16 string. maximum character is 1024.

start\_date

Required

start date reminder will be send format: YYYY-MM-dd H:i:S

periode

Required

periode reminder : daily, monthly, yearly, custom

custom\_date

Required (if periode : custom)

Message will be send for every {n} day,example for weekly reminder value : 7

title

optional

Reminder title

Response:

```javascript

{
    "status": true,
    "category": "text",
    "message": "Reminder Messages is succesfully saved and waiting to be processed",
    "data": {
        "id": "7055c898-51c3-42da-80bc-4ade8fa5e07a",
        "phone": "62813939xxxxxx",
        "title": "New Reminder",
        "message": "Reminder message for you",
        "timezone": "Asia/Jakarta",
        "start_at": "2025-05-20 13:20:00",
        "reminder_type": "custom: send every 5 days"
    }
}
        
```

### Edit/Update Reminder

`POST https://bdg.wablas.com/api/reminder/{id}`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$id = "7055c898-51c3-42da-80bc-4ade8fa5xxxx";//reminder id
$data = [
    'phone' => '6281218xxxxxx',
    'start_date' => '2025-05-20 13:20:00', //YYYY-MM-dd format H:i:S
    'message' => 'Reminder message for you',
    'title' => 'New Reminder',//optional
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/reminder/$id");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

id

Required

Reminder id, you can get reminder id from respond when create reminder using API.

phone

Required

Target phone number for reminder message.

message

Required

Text message to be sent. Format: UTF-8 or UTF-16 string. maximum character is 1024.

start\_date

Required

start date reminder will be send format: YYYY-MM-dd H:i:S

title

optional

Reminder title

Response:

```javascript

{
    "status": true,
    "category": "text",
    "message": "Reminder Messages is succesfully updated",
    "data": {
        "id": "7055c898-51c3-42da-80bc-4ade8fa5xxxx",
        "phone": "6281393961320",
        "title": "New Reminder",
        "message": "selamat datang 2 hari lgi",
        "timezone": "Asia/Jakarta",
        "start_at": "2025-05-20 13:20:00",
        "reminder_type": "custom 5"
    }
}
        
```

### Info Reminder

`GET https://bdg.wablas.com/api/reminder/info/{id}`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$id = "7055c898-51c3-42da-80bc-4ade8fa5xxxx";//reminder id
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/reminder/info/$id");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

id

Required

Reminder id, you can get reminder id from respond when create reminder using API.

Response:

```javascript

{
    "status": true,
    "category": "text",
    "message": "Reminder Messages is succesfully updated",
    "data": {
        "id": "7055c898-51c3-42da-80bc-4ade8fa5xxxx",
        "phone": "6281393961320",
        "title": "New Reminder",
        "message": "selamat datang 2 hari lgi",
        "timezone": "Asia/Jakarta",
        "start_at": "2025-05-20 13:20:00",
        "reminder_type": "custom 5"
    }
}
        
```

### Delete Reminder

`DELETE https://bdg.wablas.com/api/reminder/{id}`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$id = "7055c898-51c3-42da-80bc-4ade8fa5xxxx";//reminder id
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "DELETE");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/reminder/$id");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

id

Required

Reminder id, you can get reminder id from respond when create reminder using API.

Response:

```javascript

{
    "status": true,
    "message": "Reminder 7055c898-51c3-42da-80bc-4ade8fa5e07a is succesfully deleted"
}
        
```

### Send Text Message (v2 API)

**Purpose:** Send text messages using the enhanced v2 API. This endpoint supports bulk messaging, better error handling, and improved performance compared to v1.

The v2 API provides an improved way to send text messages with enhanced features like bulk messaging, better response handling, and more detailed status information. This endpoint is recommended for production applications and high-volume messaging.

###### API Endpoint

`POST https://bdg.wablas.com/api/v2/send-message`

###### PHP Example (Bulk Messaging):

```php

<?php
// Initialize cURL session
$curl = curl_init();

// Your API credentials
$token = "your_api_token_here";
$secret_key = "your_secret_key_here";

// Prepare message data for multiple recipients
$payload = [
    "data" => [
        [
            'phone' => '6281218xxxxxx',
            'message' => 'Hello! Welcome to our service.',
            'isGroup' => 'false',
            'flag' => 'instant'  // Enable extended processing for this message
        ],
        [
            'phone' => '6281218xxxxxx',
            'message' => 'Thank you for your order!',
            'isGroup' => 'false',
            'flag' => 'instant'  // Enable extended processing for this message
        ]
    ]
];

// Set up the API request headers
curl_setopt($curl, CURLOPT_HTTPHEADER, [
    "Authorization: $token.$secret_key",
    "Content-Type: application/json"
]);

// Configure cURL options
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($curl, CURLOPT_URL, "https://bdg.wablas.com/api/v2/send-message");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

// Execute the request
$result = curl_exec($curl);

// Check for errors
if(curl_errno($curl)) {
    echo 'Request failed: ' . curl_error($curl);
}

// Close cURL session
curl_close($curl);

// Display the result
echo "<pre>";
print_r($result);
echo "</pre>";
?>
```

###### Request Parameters:

Parameter

Type

Required

Description

`Authorization`

string

Required

Header containing your token and secret key in format: `{token}.{secret_key}`

`Content-Type`

string

Required

Must be set to `application/json`

`data`

array

Required

Array of message objects to send

`phone`

string

Required

Recipient's phone number in international format (e.g., 6281234567890)

`message`

string

Required

The text message content. No need for urlencode() in v2 API.

`isGroup`

string

Optional

Set to "true" for group messages, "false" for individual contacts (default: "false")

`ref_id`

string

Optional

Custom reference ID for message tracking and integration

`secret`

boolean

Optional

Set to true for disappearing messages (24-hour expiry)

`retry`

integer

Optional

Number of retry attempts for failed messages (default: 3)

`priority`

string

Optional

Message priority: "high", "normal", or "low"

`random`

boolean

Optional

Enable random device selection for load balancing

`spintax`

boolean

Optional

Enable spintax processing for message variations

`source`

string

Optional

Source identifier for tracking (e.g., "website", "app", "crm")

`flag`

string

Optional

Message processing flag. Set to `"instant"` to enable additional message processing and event publishing. Only messages with this flag will trigger extended processing workflows. Can be set at request level or per message item in the data array.

**Bulk Messaging Limit:** You can send up to 100 messages in a single request. For larger batches, split them into multiple requests.

###### Response Format:

###### Success Response:

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 88,
        "messages": [
            {
                "id": "5be46e84-650c-4ba1-a1a6-5647d358c43a",
                "phone": "6281218xxxxxx",
                "message": "Hello! Welcome to our service.",
                "status": "pending"
            }
        ]
    }
}
```

###### Multiple Devices Response:

```javascript

{
    "status": true,
    "message": "Messages processed successfully",
    "data": [
        {
            "device_id": "A5DOYJ",
            "quota": 88,
            "messages": [
                {
                    "id": "5be46e84-650c-4ba1-a1a6-5647d358c43a",
                    "phone": "6281218xxxxxx",
                    "message": "Hello! Welcome to our service.",
                    "status": "pending"
                }
            ]
        },
        {
            "device_id": "BK4L7G",
            "quota": 33,
            "messages": [
                {
                    "id": "bh765a2e-f0a9-43ac-8f3e-816ec7506781",
                    "phone": "628122123xxxx",
                    "message": "Thank you for your order!",
                    "status": "pending"
                }
            ]
        }
    ]
}
```

**Key Differences from v1:**

*   Uses POST method instead of GET for better security
*   No need to urlencode() message content
*   Supports bulk messaging (up to 100 messages per request)
*   Better error handling and response structure
*   Improved performance and reliability
*   JSON request body instead of query parameters

###### Best Practices

*   **Bulk Messaging:** Group related messages together to reduce API calls and improve performance.
*   **Error Handling:** Always check the response status and handle errors appropriately.
*   **Rate Limiting:** Respect API rate limits to avoid being blocked.
*   **Message Content:** Keep messages clear, concise, and relevant to recipients.
*   **Testing:** Test with a small batch before sending to large audiences.

###### Common Use Cases

*   **Marketing Campaigns:** Send promotional messages to multiple customers simultaneously.
*   **Customer Support:** Send status updates to multiple ticket holders.
*   **Event Notifications:** Send reminders or updates to event participants.
*   **System Alerts:** Send important notifications to administrators or users.
*   **Newsletters:** Distribute content updates to subscribers.

### Multiple Send Image

`POST https://bdg.wablas.com/api/v2/send-image`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$payload = [
    "data" => [
        [
            'phone' => '6281218xxxxxx',
            'image' => 'https://cdn-asset.jawapos.com/wp-content/uploads/2019/01/keluarga-pawang-di-jepang-maafkan-macan-putih-yang-membunuhnya_m_.jpg',
            'caption' => 'caption here',
        ]
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/send-image");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Target phone number. You can use the country code prefix or not.

image

Required

URL of image file to be sent. Make sure the image has been uploaded on the server and can be accessed by the public. Extention Support : jpg, jpeg, png. Max Size : 2MB.

caption

Optional

Text message to be sent. Format: UTF-8 or UTF-16 string. maximum character is 1024.

isGroup

Optional

Value is true if param phone is group ID.

ref\_id

optional

Value of transaction ID from client / sender.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

retry

optional

Message will be tried to be re-sent if previously failed to send.

priority

optional

If the value is true, The message is sent first from another message queue.

spintax

optional

If the value is true, you can call/mention data on your contact wablas on your message. Example {name}, {address}, etc

random

optional

If value TRUE & you have multiple active devices, it will sent message using randomly selected device you have.

source

optional

Message delivery grouping by source, like: blog, wordpress, fb, ig and others.

Response For Single Sender:

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 86,
        "messages": [
            {
                "id": "8ad7ecc7-d019-4305-9bc9-550605e5b816",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "caption here",
                "image": "keluarga-pawang-di-jepang-maafkan-macan-putih-yang-membunuhnya_m_.jpg",
                "status": "pending"
            }
        ]
    }
}
        
```

Response For Random Multiple Sender (random = true):

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": [
        {
            "device_id": "A5DOYJ",
            "quota": 5,
            "messages": {
                "id": "8ad7ecc7-d019-4305-9bc9-550605e5b816",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "caption here",
                "image": "image.jpg",
                "status": "pending"
            }
        },
        {
            "device_id": "BK4L7G",
            "quota": 12,
            "message": {
                "id": "as2ecc7-d019-4305-9bc9-550605e5b891",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "caption here",
                "image": "sampleImage.jpg",
                "status": "pending"
            }
        }
    ]
}
        
```

### Multiple Send Audio

`POST https://bdg.wablas.com/api/v2/send-audio`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$payload = [
    "data" => [
        [
            'phone' => '6281218xxxxxx',
            'audio' => 'https://download.samplelib.com/mp3/sample-6s.mp3',
        ]
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/send-audio");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Target phone number. You can use the country code prefix or not.

audio

Required

URL of audio file to be sent. Make sure the audio has been uploaded on the server and can be accessed by the public. Extention Support : mp3,ogg,mpga. Max Size: 2MB.

isGroup

Optional

Value is true if param phone is group ID.

ref\_id

optional

Value of transaction ID from client / sender.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

retry

optional

Message will be tried to be re-sent if previously failed to send.

priority

optional

If the value is true, The message is sent first from another message queue.

random

optional

If value TRUE & you have multiple active devices, it will sent message using randomly selected device you have.

source

optional

Message delivery grouping by source, like: blog, wordpress, fb, ig and others.

Response For Single Sender:

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 86,
        "messages": [
            {
                "id": "173c84ce-7f73-4bb2-ac3d-c7713de02292",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "audio",
                "audio":"sample_audio.mp3",
                "status": "pending"
            }
        ]
    }
}
        
```

Response For Random Multiple Sender (random = true):

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": [
        {
            "device_id": "A5DOYJ",
            "quota": 97,
            "messages": {
                "id": "173c84ce-7f73-4bb2-ac3d-c7713de02292",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "audio",
                "audio":"sample_audio.mp3",
                "status": "pending"
            }
        },
        {
            "device_id": "BK4L7G",
            "quota": 33,
            "message": {
                "id": "173c84ce-7f73-4bb2-ac3d-c7713de02292",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "audio",
                "audio":"sample_audio.mp3",
                "status": "pending"
            }
        }
    ]
}
        
```

### Multiple Send Document

`POST https://bdg.wablas.com/api/v2/send-document`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$payload = [
    "data" => [
        [
            'phone' => '6281218xxxxxx',
            'document' => 'https://pdfobject.com/pdf/sample.pdf',
        ]
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/send-document");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Target phone number. You can use the country code prefix or not.

caption

Optional

name of document

document

Required

The document file URL to be sent. Make sure documents have been uploaded on the server and can be accessed by the public. Extention Support: doc, docx, pdf, odt, csv, ppt, pptx, xls, xlsx, txt.

isGroup

Optional

Value is true if param phone is group ID.

ref\_id

optional

Value of transaction ID from client / sender.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

retry

optional

Message will be tried to be re-sent if previously failed to send.

spintax

optional

If the value is true, you can call/mention data on your contact wablas on your message. Example {name}, {address}, etc

priority

optional

If the value is true, The message is sent first from another message queue.

random

optional

If value TRUE & you have multiple active devices, it will sent message using randomly selected device you have.

source

optional

Message delivery grouping by source, like: blog, wordpress, fb, ig and others.

Response For Single Sender:

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 86,
        "messages": [
            {
                "id": "7a72d32f-d9e6-427a-a31f-ed85c2d60748",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "document",
                "document":"samplePDF.pdf",
                "status": "pending"
            }
        ]
    }
}
        
```

Response For Random Multiple Sender (random = true):

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": [
        {
            "device_id": "A5DOYJ",
            "quota": 97,
            "messages": {
                "id": "7a72d32f-d9e6-427a-a31f-ed85c2d60748",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "document",
                "document":"samplePDF.pdf",
                "status": "pending"
            }
        },
        {
            "device_id": "BK4L7G",
            "quota": 33,
            "message": {
                "id": "122d32f-d9e6-427a-a31f-ed85c2d60748",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "document",
                "document":"samplePDF.pdf",
                "status": "pending"
            }
        }
    ]
}
        
```

### Multiple Send Video

`POST https://bdg.wablas.com/api/v2/send-video`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$payload = [
    "data" => [
        [
            'phone' => '6281218xxxxxx',
            'video' => 'https://filesamples.com/samples/video/mp4/sample_960x540.mp4',
            'caption' => 'simple',
        ]
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/send-video");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Target phone number. You can use the country code prefix or not.

video

Required

Video URL file to be sent. Make sure the video has been uploaded on the server and is publicly accessible. Extention Support: mp4,mpeg.

caption

Required

Text message to be sent. Format: UTF-8 or UTF-16 string. maximum character is 1024.

isGroup

Optional

Value is true if param phone is group ID.

ref\_id

optional

Value of transaction ID from client / sender.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

retry

optional

Message will be tried to be re-sent if previously failed to send.

priority

optional

If the value is true, The message is sent first from another message queue.

random

optional

If value TRUE & you have multiple active devices, it will sent message using randomly selected device you have.

source

optional

Message delivery grouping by source, like: blog, wordpress, fb, ig and others.

Response For Single Sender:

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 86,
        "messages": [
            {
                "id": "75469772-4dde-4012-83d4-2a5fdcdab882",
                "phone":"08122299990",
                "message":"nul"
                "caption": "new video",
                "video": "sample_960x540.mp4",
                "status": "pending"
            }
        ]
    }
}
        
```

Response For Random Multiple Sender (random = true):

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": [
        {
            "device_id": "A5DOYJ",
            "quota": 5,
            "messages": {
                "id": "8ad7ecc7-d019-4305-9bc9-550605e5b816",
                "phone": "6281218xxxxxx",
                "message":"nul"
                "caption": "new video",
                "video": "sample_960x540.mp4",
                "status": "pending"
            }
        },
        {
            "device_id": "BK4L7G",
            "quota": 12,
            "message": {
                "id": "as2ecc7-d019-4305-9bc9-550605e5b891",
                "phone": "6281218xxxxxx",
                "message":"nul"
                "caption": "new video 2",
                "video": "sample_960x540.mp4",
                "status": "pending"
            }
        }
    ]
}
        
```

### Multiple Send Link with Preview

`POST https://bdg.wablas.com/api/v2/send-link`

Example Link Message with Preview Thumbnail  

[Image: list1](https://converturltomd.com/assets/images/gallery/api/link-message.jpg)  
  

```php

<?php
$curl = curl_init();
$token = "";
$payload = [
$secret_key = "";
    "data" => [
        [
            'phone' => '6281218xxxxxx',
            'message'=> [
                'text' => 'WABLAS is an Whatsapp API Gateway for WhatsApp API for Business. It allows developers to interact with WhatsApp's service without having to deal with the complexities of the WhatsApp protocol.',
                'link' => 'https://wablas.com',
                ],
        ]
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/send-link");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

text

Optional

Additional text message

link

Required

URL link for the message

isGroup

Optional

Value is true if param phone is group ID.

Response:

```javascript

{
    "status": true,
    "message": "Link Preview Message is pending and waiting to be processed, with error: 0",
    "data": {
        "device_id": "LJHXX",
        "quota": "unlimited",
        "messages": [
            {
                "id": "831e3455-43a2-49af-997b-ad007b37sssa",
                "phone": "6283817112121",
                "message": "Whatsapp API Gateway Service for Business",
                "status": "pending",
                "ref_id": null
            }
        ]
    }
}
        
```

### Multiple Send List

`POST https://bdg.wablas.com/api/v2/send-list`

Example List Message  
Body Message :  
[Image: list1](https://converturltomd.com/assets/images/gallery/api/List1.jpg)  
Button List :  
[Image: list2](https://converturltomd.com/assets/images/gallery/api/List2.jpg)  

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$payload = [
    "data" => [
        [
            'phone' => '6281218xxxxxx',
            'message'=> [
                'title' => 'title',
                'description' => 'Test',
                'buttonText' => 'menu',
                'lists' => [
                    [
                        'title' => '1',
                        'description' => 'promo 1',
                    ],
                    [
                        'title' => '2',
                        'description' => 'promo 2',
                    ],
                ],
                'footer' => 'footer template here',
            ],
        ]
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/send-list");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Target phone number. You can use the country code prefix or not.

message

Required

Text message to be sent. Format: UTF-8 or UTF-16 string. maximum character is 1024.

title

Required

Title of the message to be sent.

description

Required

content message

button Text

Required

Button Text for displayed list

list

Required

title: title list  
description: content message in list

footer

Required

A section located under the main text, or body.

isGroup

Optional

Value is true if param phone is group ID.

ref\_id

optional

Value of transaction ID from client / sender.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

retry

optional

Message will be tried to be re-sent if previously failed to send.

priority

optional

If the value is true, The message is sent first from another message queue.

random

optional

If value TRUE & you have multiple active devices, it will sent message using randomly selected device you have.

source

optional

Message delivery grouping by source, like: blog, wordpress, fb, ig and others.

Response:

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": "unlimited",
        "messages": [
            {
                "id": "a8b52b03-9da6-4b23-8b2d-ae2e3ccba0a0",
                "phone": "6283817519531",
                "message": "Test",
                "status": "pending"
            }
        ]
    }
}        
```

### Multiple Send Schedule

`POST https://bdg.wablas.com/api/v2/schedule`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$payload = [
    "data" => [
        [
            'category' => 'text',
            'phone' => '6281218xxxxxx',
            'scheduled_at' => '2022-05-20 13:20:00',
            'text' => 'Hallo kakak',
        ],
        [
            'category' => 'image',
            'phone' => '6281218xxxxxx',
            'scheduled_at' => '2022-05-20 13:20:00',
            'text' => 'Cover Novel',
            'url' => ' https://bdg.wablas.com/image/20220315081917.jpeg',
        ],
        [
            'category' => 'template',
            'phone' => '6281218xxxxxx',
            'scheduled_at' => '2022-05-20 13:20:00',
            'text' => [
                'title' => [
                    'type' => 'image',
                    'content' => 'https://cdn-asset.jawapos.com/wp-content/uploads/2019/01/keluarga-pawang-di-jepang-maafkan-macan-putih-yang-membunuhnya_m_.jpg',
                ],
                'buttons' => [
                    'url' => [
                        'display' => 'wablas.com',
                        'link' => 'https://wablas.com',
                    ],
                    'call' => [
                        'display' => 'contact us',
                        'link' => '081223644660',
                    ],
                    'quickReply' => ["reply 1","reply 2"],
                ],
                'content' => 'sending template message...',
                'footer' => 'footer template here',
            ],
        ],
        [
            'category' => 'button',
            'phone' => '6281218xxxxxx',
            'scheduled_at' => '2022-05-20 13:20:00',
            'text' => [
                'buttons' => ["button 1","button 2","button 3"],
                'content' => 'sending template message...',
                'footer' => 'footer template here',
            ],
        ],
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/schedule");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Target phone number. You can use the country code prefix or not.

category

Required

Category of message, such as text, image, video, document, audio, tamplate, and location.

scheduled\_at

Required

Date and Time message wants to be sent. Format: YYYY-mm-dd H:i:s, Example: 2123-05-11 09:10:05

random

optional

If value TRUE & you have multiple active devices, it will sent message using randomly selected device you have.

Response:

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "messages": [
            {
                "id": "53ac1975-41ec-44ed-acf9-3b0ccdcab748",
                "phone": "62813939121",
                "messages": "Hallo kakak",
                "file": null,
                "timezone": "Asia/Jakarta",
                "schedule_at": "2022-05-20 13:20:00"
            },
        ]
    }
}
        
```

### Delete Schedule

`DELETE https://bdg.wablas.com/api/v2/delete-schedule?id=xxx,xxx,xxx`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$id = "232132132132132,12321321321321";//multiple ID separated by ,
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "DELETE");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/delete-schedule?id=$id");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

id

Required

Unix ID from schedule message. Look response documentation api send schedule. Example: 8abe5c56-7f43-451b-8b2d-91a9f9a74561 , multiple id separated by ,

Response:

```javascript

{
    "status": true,
    "message" : "schedules deleted successfully",
}
        
```

### Update Multiple Schedule

`PUT https://bdg.wablas.com/api/v2/schedule/{schedule_id}`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$payload = [
    "data" => [
        [
            'category' => 'text',
            'phone' => '6281218xxxxxx',
            'scheduled_at' => '2022-05-20 13:20:00',
            'text' => 'Hallo kakak',
        ],
        [
            'category' => 'image',
            'phone' => '6281218xxxxxx',
            'scheduled_at' => '2022-05-20 13:20:00',
            'text' => 'Cover Novel',
            'url' => ' https://bdg.wablas.com/image/20220315081917.jpeg',
        ],
        [
            'category' => 'template',
            'phone' => '6281218xxxxxx',
            'scheduled_at' => '2022-05-20 13:20:00',
            'text' => [
                'title' => [
                    'type' => 'image',
                    'content' => 'https://cdn-asset.jawapos.com/wp-content/uploads/2019/01/keluarga-pawang-di-jepang-maafkan-macan-putih-yang-membunuhnya_m_.jpg',
                ],
                'buttons' => [
                    'url' => [
                        'display' => 'wablas.com',
                        'link' => 'https://wablas.com',
                    ],
                    'call' => [
                        'display' => 'contact us',
                        'link' => '081223644660',
                    ],
                    'quickReply' => ["reply 1","reply 2"],
                ],
                'content' => 'sending template message...',
                'footer' => 'footer template here',
            ],
        ],
        [
            'category' => 'button',
            'phone' => '6281218xxxxxx',
            'scheduled_at' => '2022-05-20 13:20:00',
            'text' => [
                'buttons' => ["button 1","button 2","button 3"],
                'content' => 'sending template message...',
                'footer' => 'footer template here',
            ],
        ],
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "PUT");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/schedule/{schedule_id}");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

Phone

Required

Target phone number. You can use the country code prefix or not.

Schedule\_id

Required

Unix ID from schedule message. Look response documentation api send schedule. Example: 8abe5c56-7f43-451b-8b2d-91a9f9a74561

Category

Required

Category of message, such as text, image, video, document, audio, tamplate, and location.

Scheduled\_at

Required

Date and Time message wants to be sent. Format: YYYY-mm-dd H:i:s, Example: 2123-05-11 09:10:05

Response:

```javascript

{
    "status": true,
    "id": "540a61de-d705-4331-9edc-ebbdb0e0c1e9",
    "category": "image",
    "message": "Scheduled Messages is succesfully Updated",
    "timezone": "Asia/Jakarta",
    "schedule_at": "2022-05-20 13:20:00",
    "phone": "08130391212",
    "messages": "Cover Novel",
    "file": " https://bdg.wablas.com/image/20220315081917.jpeg"
}
        
```

### Multiple Send Location

`POST https://bdg.wablas.com/api/v2/send-location`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$payload = [
    "data" => [
        [
            'phone' => '6281218xxxxxx',
            'message' => [
                'name' => 'place name',
                'address' => 'street',
                'latitude' => 24.121231,
                'longitude' => 55.1121221,
            ],
        ]
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/send-location");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Target phone number. You can use the country code prefix or not.

message

Required

**name:** Name of place.  
**addres:** Address of place.  
**latitude:** Geographic coordinate that specifies the east-west position of a point on the Earth's surface, measured in degrees from the prime meridian (0 degrees) to the International Date Line (180 degrees).  
**longitude:** A horizontal line. Point 0 is the angle of the equator, the plus (+) sign indicates the upward direction towards the north pole, while the minus (-) sign points to the south pole.

isGroup

Optional

Value is true if param phone is group ID.

ref\_id

optional

Value of transaction ID from client / sender.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

retry

optional

Message will be tried to be re-sent if previously failed to send.

priority

optional

If the value is true, The message is sent first from another message queue.

random

optional

If value TRUE & you have multiple active devices, it will sent message using randomly selected device you have.

Response:

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 86,
        "messages": [
            {
                "id": "f0339763-8092-460b-a03e-e58f32818571",
                "phone": "6281223644660",
                "message": "{\"name\":\"place name\",\"address\":\"street\",\"latitude\":24.121231,\"longitude\":55.1121221}",
                "status": "pending"
            }
        ]
    }
}
        
```

### Send Message Text Group Wablas

**This API for Send to Group WABLAS not Group Whatsapps , For Group WA : [Click Here](#send-group)**

`GET https://bdg.wablas.com/api/v2/group/text`

```php

<?php
$curl = curl_init();
$token = "";
$group_id = "asdw12213212";
$secret_key = "";
$message = urlencode("test get");

curl_setopt($curl, CURLOPT_URL, "https://bdg.wablas.com/api/send-message?phone=$group_id&message=$message&token=$token");
$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

group\_id

Required

id group of wablas phone group

message

Required

Text message to be sent. Format: UTF-8 or UTF-16 string. maximum character is 1024.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

priority

optional

If the value is true, The message is sent first from another message queue.

spintax

optional

If the value is true, you can call/mention data on your contact wablas on your message. [Example](#mention)

Response For Single Sender:

```javascript

{
    "status": true,
    "message": "Message to Group {group_id} is pending and waiting to be processed",
    "data": {
        "device_id": "LJH8UM",
        "quota": "unlimited",
        "messages": [
            {
                "id": "b86707c4-a3c8-4f4e-956f-059df8ab7730",
                "phone": "6281393961320",
                "message": "Testing 1",
                "status": "pending",
                "ref_id": null
            },
            {
                "id": "b86707c4-a3c8-4f4e-956f-059df8ab7730",
                "phone": "6281393961321",
                "message": "Testing 1",
                "status": "pending",
                "ref_id": null
            },
            ...
        ]
    }
}
        
```

### Send Text Message to Group Wablas

**This API for Send to Group WABLAS not Group Whatsapps , For Group WA : [Click Here](#send-group)**

`POST https://bdg.wablas.com/api/v2/group/text`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$payload = [
    "data" => [
        [
            'group_id' => 'sdf18xxxxxx',
            'message' => 'hello there',
        ]
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/group/text");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

group\_id

Required

id group of wablas phone group

message

Required

Text message to be sent. Format: UTF-8 or UTF-16 string. maximum character is 1024.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

retry

optional

Message will be tried to be re-sent if previously failed to send.

priority

optional

If the value is true, The message is sent first from another message queue.

spintax

optional

If the value is true, you can call/mention data on your contact wablas on your message. [Example](#mention)

Response:

```javascript

{
    "status": true,
    "message": "Message to Group {group_id} is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 88,
        "messages": [
            {
                "id": "5be46e84-650c-4ba1-a1a6-5647d358c43a",
                "phone": "6281218xxxxxx",
                "message": "hello there",
                "status": "pending"
            },
            {
                "id": "bh765a2e-f0a9-43ac-8f3e-816ec7506781",
                "phone": "628122123xxxx",
                "message": "hello there",
                "status": "pending"
            }
        ]
    }
}
        
```

### Send Image Message to Group Wablas

**This API for Send to Group WABLAS not Group Whatsapps , For Group WA : [Click Here](#send-group)**

`POST https://bdg.wablas.com/api/v2/group/image`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$payload = [
    "data" => [
        [
            'group_id' => 'asdsax11121',
            'image' => 'https://cdn-asset.jawapos.com/wp-content/uploads/2019/01/keluarga-pawang-di-jepang-maafkan-macan-putih-yang-membunuhnya_m_.jpg',
            'caption' => 'caption here',
        ]
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/group/image");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

group\_id

Required

ID group of Wablas phone group

image

Required

URL of image file to be sent. Make sure the image has been uploaded on the server and can be accessed by the public. Extention Support : jpg, jpeg, png. Max Size : 2MB.

caption

Optional

Text message to be sent. Format: UTF-8 or UTF-16 string. maximum character is 1024.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

retry

optional

Message will be tried to be re-sent if previously failed to send.

priority

optional

If the value is true, The message is sent first from another message queue.

Response For Single Sender:

```javascript

{
    "status": true,
    "message": "Message to Group {group_id} is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 86,
        "messages": [
            {
                "id": "8ad7ecc7-d019-4305-9bc9-550605e5b816",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "caption here",
                "image": "keluarga-pawang-di-jepang-maafkan-macan-putih-yang-membunuhnya_m_.jpg",
                "status": "pending"
            },
            {
                "id": "8ad7ecc7-d019-4305-9bc9-550605e5b816",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "caption here",
                "image": "keluarga-pawang-di-jepang-maafkan-macan-putih-yang-membunuhnya_m_.jpg",
                "status": "pending"
            }
        ]
    }
}
        
```

### Send Video Message to Group Wablas

**This API for Send to Group WABLAS not Group Whatsapps , For Group WA : [Click Here](#send-group)**

`POST https://bdg.wablas.com/api/v2/group/video`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$payload = [
    "data" => [
        [
            'group_id' => '6281218xxxxxx',
            'video' => 'https://filesamples.com/samples/video/mp4/sample_960x540.mp4',
            'caption' => 'simple',
        ]
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/group/video");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

group\_id

Required

id group of wablas phone group

video

Required

Video URL file to be sent. Make sure the video has been uploaded on the server and is publicly accessible. Extention Support: mp4,mpeg.

caption

Required

Text message to be sent. Format: UTF-8 or UTF-16 string. maximum character is 1024.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

retry

optional

Message will be tried to be re-sent if previously failed to send.

priority

optional

If the value is true, The message is sent first from another message queue.

Response For Single Sender:

```javascript

{
    "status": true,
    "message": "Message to Group {group_id} is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 86,
        "messages": [
            {
                "id": "75469772-4dde-4012-83d4-2a5fdcdab882",
                "phone":"08122299990",
                "message":"nul"
                "caption": "new video",
                "video": "sample_960x540.mp4",
                "status": "pending"
            },
            {
                "id": "75469772-4dde-4012-83d4-2a5fdcdab882",
                "phone":"08122299990",
                "message":"nul"
                "caption": "new video",
                "video": "sample_960x540.mp4",
                "status": "pending"
            }
        ]
    }
}
        
```

### Send Audio Message to Group Wablas

**This API for Send to Group WABLAS not Group Whatsapps , For Group WA : [Click Here](#send-group)**

`POST https://bdg.wablas.com/api/v2/group/audio`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$payload = [
    "data" => [
        [
            'group_id' => 'asdw12213212',
            'audio' => 'https://download.samplelib.com/mp3/sample-6s.mp3',
        ]
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/group/audio");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

group\_id

Required

ID group of Wablas phone group

audio

Required

URL of audio file to be sent. Make sure the audio has been uploaded on the server and can be accessed by the public. Extention Support : mp3,ogg,mpga. Max Size: 2MB.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

priority

optional

If the value is true, The message is sent first from another message queue.

Response For Single Sender:

```javascript

{
    "status": true,
    "message": "Message to Group {group_id} is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 86,
        "messages": [
            {
                "id": "173c84ce-7f73-4bb2-ac3d-c7713de02292",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "audio",
                "audio":"sample_audio.mp3",
                "status": "pending"
            },
            {
                "id": "173c84ce-7f73-4bb2-ac3d-c7713de02292",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "audio",
                "audio":"sample_audio.mp3",
                "status": "pending"
            }
        ]
    }
}
        
```

### Send Document Message to Group Wablas

**This API for Send to Group WABLAS not Group Whatsapps , For Group WA : [Click Here](#send-group)**

`POST https://bdg.wablas.com/api/v2/group/document`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$payload = [
    "data" => [
        [
            'group_id' => 'i87y9213xxxxx',
            'document' => 'https://pdfobject.com/pdf/sample.pdf',
        ]
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/group/document");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

group\_id

Required

ID group of Wablas phone group

caption

Optional

name of document

document

Required

The document file URL to be sent. Make sure documents have been uploaded on the server and can be accessed by the public. Extention Support: doc, docx, pdf, odt, csv, ppt, pptx, xls, xlsx, txt.

secret

optional

If the value is true, after successfully sending the message, it will be deleted from the database.

retry

optional

Message will be tried to be re-sent if previously failed to send.

priority

optional

If the value is true, The message is sent first from another message queue.

Response For Single Sender:

```javascript

{
    "status": true,
    "message": "Message to Group {group_id} is pending and waiting to be processed",
    "data": {
        "device_id": "A5DOYJ",
        "quota": 86,
        "messages": [
            {
                "id": "7a72d32f-d9e6-427a-a31f-ed85c2d60748",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "document",
                "document":"samplePDF.pdf",
                "status": "pending"
            },
            {
                "id": "7a72d32f-d9e6-427a-a31f-ed85c2d60748",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "document",
                "document":"samplePDF.pdf",
                "status": "pending"
            }
        ]
    }
}
        
```

Response For Random Multiple Sender (random = true):

```javascript

{
    "status": true,
    "message": "Message is pending and waiting to be processed",
    "data": [
        {
            "device_id": "A5DOYJ",
            "quota": 97,
            "messages": {
                "id": "7a72d32f-d9e6-427a-a31f-ed85c2d60748",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "document",
                "document":"samplePDF.pdf",
                "status": "pending"
            }
        },
        {
            "device_id": "BK4L7G",
            "quota": 33,
            "message": {
                "id": "122d32f-d9e6-427a-a31f-ed85c2d60748",
                "phone": "6281218xxxxxx",
                "message": null,
                "caption": "document",
                "document":"samplePDF.pdf",
                "status": "pending"
            }
        }
    ]
}
        
```

### Auto Reply

`POST https://bdg.wablas.com/api/v2/autoreply`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$payload = [
    'keyword' => 'hello',
    'response' => 'hello too.'
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/autoreply");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

keyword

Required

Keyword used for auto-reply

response

Required

Auto-reply response when the keyword is used

Example Response:

```javascript

{
    "status": true,
    "message": "Auto reply created successfully",
    "data": {
        "id": "38f6c51d-a243-44b5-9d49-2f4e7ea67ae7",
        "device": "32ZU3E",
        "keyword": "hello",
        "response": "hello too."
    }
}
        
```

### Edit Auto Reply

`PUT https://bdg.wablas.com/api/v2/autoreply/{id}`

```php

<?php
$curl = curl_init();
$id = "";
$token = "";
$secret_key = "";
$payload = [
    'keyword' => 'keyword 1',
    'response' => 'new response to keyword 1',
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "PUT");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/autoreply/$id");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

id

Required

ID Auto reply

keyword

Required

Keyword used for auto-reply

response

Required

Auto-reply response when the keyword is used

Response :

```javascript

{
    "status": true,
    "message": "update autoreply keyword: keyword 1 successfully",
    "data": {
        "id": "4d3fb0c2-7e7e-4375-8715-2daebe45xxxx",
        "device": "SAG2S",
        "keyword": "keyword 1",
        "response": "new response to keyword 1"
    }
}
        
```

### Delete Auto Reply

`DELETE https://bdg.wablas.com/api/v2/autoreply/{id}`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$id = "";
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "DELETE");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/autoreply/$id");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

id

Required

ID auto reply

Response:

```javascript

{
    "status": true,
    "message": "remove autoreply keyword: makan roti successfully"
}
        
```

### Retrieve Auto Reply Data

`GET https://bdg.wablas.com/api/v2/autoreply/getData?keyword=sample`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "PUT");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/autoreply/getData?keyword=sample");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

keyword

Optional

Keyword used for auto-reply

Response :

```javascript

{
    "status": true,
    "message": "sucessfully get autoreplies data",
    "data": [
        {
            "id": "11438c40-4b41-4948-9bfa-71ae23f2973c",
            "device": "32ZU3E",
            "keyword": "keyword 1",
            "category": "text",
            "response": "example reponse 1",
            "file": null
        }
    ]
}
        
```

  
Response without body/payload , it will get all autoreplies

```javascript

{
    "status": true,
    "message": "sucessfully get autoreplies data",
    "data": [
        {
            "id": "11438c40-4b41-4948-9bfa-71ae23fXXXc",
            "device": "32ZXXE",
            "keyword": "keyword 1",
            "category": "text",
            "response": "example reponse 1",
            "file": null
        },
        {
            "id": "1e2ab681-597b-4535-bb00-f3365245XXX",
            "device": "32ZXXE",
            "keyword": "mata hari 6",
            "category": "text",
            "response": "",
            "file": null
        },
        ......,

        {
            "id": "f9aa215b-766c-42a5-aa42-b2cc17dXXXX",
            "device": "32ZXXE",
            "keyword": "mata hari",
            "category": "text",
            "response": "hari gini masih makan",
            "file": null
        }
    ]
}
        
```

### Create Multiple Contact

`POST https://bdg.wablas.com/api/v2/contact`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$payload = [
    "data" => [
        [
            'name' => 'Danu',
            'phone' => '6285867765222'
        ],
        [
            'name' => 'Karina Setya',
            'phone' => '6285867765777',
            'email' => '[email protected]',
            'birth_day' => '1992-03-12',
            'address' => 'Kedokan RT 02/ RW 04 Klego Boyolali',
        ],
        [
            'name' => 'Danu',
            'phone' => '6285867765222'
        ]
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/contact");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Whatsapp Number .You can use the country code prefix or not

name

Required

Contact Name, Example: Gerart Sebastian

email

Optional

Email Contact

address

Optional

Contact Address, Example: Beverly Hills, 455 N. Rexford Drive Beverly Hills CA 90210, United States

birth\_day

Optional

Info birthday for contact (Format: YYYY-mm-dd), Example : 1992-09-23

Response:

```javascript

{
    "status": true,
    "message": "Successfully Add contact",
    "data": {
        "messages": [
            {
                "phone": "6285867765222",
                "message": "successfully add 6285867765222 to contact",
                "status": true
            },
            {
                "phone": "6285867765777",
                "message": "successfully add 6285867765777 to contact",
                "status": true
            },
            {
                "phone": "6285867765222",
                "message": "6285867765222 already add on contact",
                "status": false
            }
        ]
    }
}

        
```

### Update Contact

`POST https://bdg.wablas.com/api/v2/contact/update`

```php

<?php
$curl = curl_init();
$token = "";
$payload = [
    "data" => [
        [
            'name' => 'Danu',
            'phone' => '6285867765222'
        ],
        [
            'name' => 'Karina Setya',
            'phone' => '6285867765777',
            'email' => '[email protected]',
            'birth_day' => '1992-03-12',
            'address' => 'Kedokan RT 02/ RW 04 Klego Boyolali',
        ],
        [
            'name' => 'Danu',
            'phone' => '6285867765222'
        ]
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
    "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/contact/update");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

Whatsapp Number .You can use the country code prefix or not

name

Required

Contact Name, Example: Gerart Sebastian

email

Optional

Email Contact

address

Optional

Contact Address, Example: Beverly Hills, 455 N. Rexford Drive Beverly Hills CA 90210, United States

birth\_day

Optional

Info birthday for contact (Format: YYYY-mm-dd), Example : 1992-09-23

Response:

```javascript

{
    "status": true,
    "message": "Successfully Add contact",
    "data": {
        "messages": [
            {
                "phone": "6285867765222",
                "message": "successfully add 6285867765222 to contact",
                "status": true
            },
            {
                "phone": "6285867765777",
                "message": "contact 6285867765777 not found",
                "status": false
            }
        ]
    }
}

        
```

### Delete Contact

`DELETE https://bdg.wablas.com/api/contact`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$phone = "";
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "DELETE");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/contact?phone=$phone");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Required

contact phone number to be deleted. multiple phone separated by , (comma)

Response:

```javascript

{
    "status": true,
    "message": "Successfully deleted contacts: 6281393961320, 628123123123, 628123123123, 6281231231211"
}
        
```

### List Contact

`GET https://bdg.wablas.com/api/v2/contact`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/contact");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

phone

Optional

Specifies the contact phone details. Example: https://bdg.wablas.com/api/v2/contact?phone=0813xxxxx

page

Optional

Specifies the page number to navigate to.

limit

Optional

Specifies the limit of phone data to display per page.

Response:

```javascript

{
    "status": true,
    "totalData": 18,
    "perPage": 1,
    "page": 2,
    "totalPage": 9,
    "message": [ 
        {
        "id": "06b86788-27d0-4243-a45c-fcce095e3846",
        "phone": "6285282062748",
        "email": "[email protected]",
        "name": "Maulana Malik ",
        "nickname": "Maliki",
        "status": "active",
        "address": null,
        "gender": "male",
        "birth_day": "12-12-1989",
        "photo": null,
        "date": {
            "created_at": "2024-02-29 15:34:05",
            "updated_at": "2024-02-29 15:34:05"
            }
        }
    ]
}
        
```

### Create Multiple Agent

`POST https://bdg.wablas.com/api/v2/create-agent`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$payload = [
    "data" => [
        [
        'name' => 'danu',
        'phone' => '6281218xxxxxx',
        'email' => '[email protected]',
        'password' => 'xxxxxxxx',
        ]
    ]
];
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
        "Content-Type: application/json"
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload) );
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/create-agent");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

name

Required

Name agent

phone

Required

Whatsapp Number .You can use the country code prefix or not

email

Required

Email agent

password

Required

Password agent

Response:

```javascript

{
    "status": true,
    "message": "Create Agent Success",
    "data": {
        "Total Agent": 8,
        "Remaining Slot": 16
    },
    "Info Agent": [
        {
            "name": "Harsoyo",
            "email": "[email protected]",
            "phone": "628139396132301"
        }
    ]
}
        
```

### Delete Media

`DELETE https://bdg.wablas.com/api/v2/media/delete/{id}`

```php

<?php
$curl = curl_init();
$token = "";
$secret_key = "";
$id = "";
curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token.$secret_key",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "DEL");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/v2/media/delete/$id");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
curl_close($curl);
echo "<pre>";
print_r($result);

?>
```

###### Request parameters:

Authorization

Required

{$token}.{$secret\_key}

token

Required

token can be found in the menu: Device - Settings

secret\_key

Required

serial\_key can be obtained by generating it in device settings - the secret\_key will be sent to the admin's WhatsApp number.

{id}

Required

unix ID from message. look response documentation api send message

Response:

```javascript

{
    "status": true,
    "message" : "image file succesfully removed",
}
        
```

### Webhook For Receive Incoming Whatsapp Message

`POST https://yourdomain.com/webhook`

Retrieve new incoming messages from WhatsApp, so every time a new message is sent, we will forward it to this URL. The webhooks URL can be set on menu: Device - Setting  
**input webhook url on Webhook URL for Inbound Message. (Don't forget to activated "Get Incoming Message").**

Make sure you have a domain that can be accessed publicly as namadomain.com, then place the webhook file in the folder, so that later your webhook URL is **https://yourdomain.com/webhook.php**  
The following is the data that will be sent to your webhook URL:  
**Note : To get auto reply from webhook, activated "Get Auto Reply From Webhook"**  

##### Example Json send to Webhook

*   Personal Message
    
    ```javascript
    
    {
        "id": "809DE6896F2203BC296652E16DEEC90E",
        "pushName": "Marina Karina",
        "isGroup": false,
        "group": {
            "sender": "",
            "subject": "",
            "owner": "",
            "desc": "",
            "participants": null
        },
        "message": "File",
        "phone": "6281393961XXX",
        "messageType": "text",
        "file": "",
        "url": "",
        "mimeType": "",
        "deviceId": "A0HDJU",
        "sender": "6289628189XXX",
        "isFromMe": false,
        "timestamp": "2021-03-31T02:15:45Z",
        "profileImage": "https://pps.whatsapp.net/v/t61.24694-24/321179913_854695722486402_3839169477576616424_n.jpg?stp=dst-jpg_s96x96&ccb=11-4&oh=01_AdRtuYKyf7O8VF--YF1eQc9OOzQsNyZ-J2w9vuwtFls28Q&oe=643357B3"
    }
                
    ```
    
*   Group Message
    
    ```javascript
    
    {
        "id": "3270641EBAD48823723D636B1B51F28D",
        "pushName": "Keles Sebastian",
        "isGroup": true,
        "group": {
            "sender": "6281393961XXX",
            "subject": "Group Tester",
            "owner": "6289628189XXX",
            "desc": "",
            "participants": [
                {
                    "jid": "[email protected]",
                    "is_admin": true
                },
                {
                    "jid": "[email protected]",
                    "is_admin": false
                }
            ]
        },
        "message": "admin kick aku please !",
        "phone": "120363064449269XXX",
        "messageType": "text",
        "file": "",
        "url": "",
        "mimeType": "",
        "deviceId": "A0HXXX",
        "sender": "6289628189XXX",
        "isFromMe": false,
        "timestamp": "2021-03-31T02:17:56Z",
        "profileImage": ""
    }
                
    ```
    

```php
<?php
header("Content-Type: text/plain");
/**
* all data POST sent from  https://bdg.wablas.com
* you must create URL what can receive POST data
* we will sent data like this:

* id = message ID - string
* phone = sender phone - string
* message = content of message - string
* pushName = Sender Name like contact name - string (optional)
* groupSubject = Group Name - string (optional)
* timestamp = time send message
* file = name of the file when receiving media message (optional)
* url = url file media message (optional)
* messageType = text/image/document/video/audio/location - string
* mimeType = type file (optional)
* deviceId = unix ID device
* sender = phone number device - integer
*/
$content = json_decode(file_get_contents('php://input'), true);

$id = $content['id'];
$pushName = $content['pushName'];
$isGroup = $content['isGroup'];
if ($isGroup == true) {
    $senderMessage = $content['group']['sender'];// WA member who sends message to group
    $subjectGroup = $content['group']['subject'];
    $ownerGroup = $content['group']['owner'];
    $decriptionGroup = $content['group']['desc'];
    $partisipanGroup = $content['group']['participants'];
}
$message = $content['message'];
$phone = $content['phone'];
$messageType = $content['messageType'];
$file = $content['file'];
$mimeType = $content['mimeType'];
$deviceId = $content['deviceId'];
$sender = $content['sender'];
$timestamp = $content['timestamp'];
echo $message;
?>
```

```php
<?php
header("Content-Type: text/plain");
/**
 * for auto reply or bot
 */
$content = json_decode(file_get_contents('php://input'), true);
if($content['message'] == 'hello') {
    echo "Hello too.";
} else {
    echo null;
}

?>
```

```php
<?php
header("Content-Type: text/plain");
/**
 * Save to database table inbox
 */
$content = json_decode(file_get_contents('php://input'), true);
if(isset($content['message')) {
    $conn = new mysqli("localhost", "userxxx", "passwordxxx", "bot_db");
    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $id = $content['id'];
    $phone = $content['phone'];
    $message = $content['message'];

    $sql = "INSERT INTO inbox (message_id, phone, message) VALUES ($id, $phone, $message)";
    if ($conn->query($sql) === TRUE) {
        echo null;
    } else {
        echo "Error: " . $sql . "" . $conn->error;
    }
    $conn->close();
}
?>
```

```php
<?php
header('Content-Type: application/json');
/**
 * for auto reply or bot with multiple message. currently only supports text and images
 */
$content = json_decode(file_get_contents('php://input'), true);

// reply with image message
$payload[] = [
    'category' => 'image',
    'caption' => 'caption image',
    'urlFile' => 'https://cdn-asset.jawapos.com/wp-content/uploads/2019/01/keluarga-pawang-di-jepang-maafkan-macan-putih-yang-membunuhnya_m_.jpg'
];

// message with text message
$payload[] = [
    'category' => 'text',
    'message' => 'message: '.$content['message'],
];

// reply with document message
$payload[] = [
    'category' => 'document',
    'urlFile' => 'https://africau.edu/images/default/sample.pdf'
];

// reply with video message
$payload[] = [
    'category' => 'video',
    'caption' => 'caption video',
    'urlFile' => 'http://techslides.com/demos/sample-videos/small.mp4'
];

// reply with audio message
$payload[] = [
    'category' => 'audio',
    'urlFile' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
];

// reply with button message
$payload[] = [
    'category' => 'button',
    'message' => '{"buttons":["button 12","button 22","button 33"],"content":"sending button message.","footer":"footer here"}'
];

// reply with template message
$payload[] = [
    'category' => 'template',
    'message' => '{"title":{"type":"image","content":"https:\/\/cdn-asset.jawapos.com\/wp-content\/uploads\/2019\/01\/keluarga-pawang-di-jepang-maafkan-macan-putih-yang-membunuhnya_m_.jpg"},"buttons":{"url":{"display":"wablas.com","link":"https:\/\/wablas.com"},"call":{"display":"contact us","phone":"081223644660"},"quickReply":["reply 1","reply 2"]},"content":"sending template message...","footer":"footer template here"}'
];

// reply with list message
$payload[] = [
    'category' => 'list',
    'message' => '{"title":"title","description":"descript","buttonText":"button text","lists":[{"title":"1","description":"promo 1"},{"title":"2","description":"promo 2"}],"footer":"footer"}'
];

echo json_encode(['data' => $payload]);

?>
```

###### Body Response:

id

string

Message ID like random string

mandatory

phone

string

sender number, example: 62821144818

mandatory

pushName

string

sender name example: Peter

optional

message

string

content of message

optional

messageType

string

type of message. example: text, image, document, video, audio, or location

optional

group

array

\- Sender

\- Subject

\- Owner

\- Participants

optional

file

string

Name file

optional

mimeType

string

mimeType of file

optional

url

string

url of file

optional

deviceId

string

Device ID for sender

mandatory

sender

integer

whatsapp number for sender

mandatory

profileImage

URL

whatsapp profile image

optional

### Webhook For Tracking Whatsapp Message

`POST https://your-domain.com/tracking`

Retrieve new status of messages from WhatsApp, so every time a new status of message update for example:sent, read, cancel, received, reject, pending, we will forward it to this URL **Device - Setting - Tracking URL**

Make sure you have a domain that can be accessed publicly as namadomain.com, then place the webhook file in the folder, so that later your webhook URL is **https://yourdomain.com/tracking.php**  
The following is the data that will be sent to your webhook URL:

```php
<?php
/**
* all data POST sent from  https://bdg.wablas.com
* you must create URL what can receive POST data
* we will sent data like this:
* id = message ID - string
* phone = whatsapp number of customer
* status = status of message - string
* note = information - string
* deviceId = device ID - string
*/

$content = json_decode(file_get_contents('php://input'), true);

$id = $content['id'];
$status = $content['status'];
$phone = $content['phone'];
$note = $content['note'];
$sender = $content['sender'];
$deviceId = $content['deviceId'];

?>
```

###### Body Response:

id

string

Message ID like random string

phone

string

Telephone number of the recipient of the message

status

string

pending, delivered, received, sent, read, cancel, rejected.

deviceId

string

ID your device

### Webhook Device

`POST https://your-domain.com/device`

For Receive Status Device, for example when device disconnected

Make sure you have a domain that can be accessed publicly as namadomain.com, then place the webhook file in the folder, so that later your webhook URL is **https://yourdomain.com/device.php**  
The following is the data that will be sent to your webhook URL:

```javascript

{
    "deviceId": "LJH8UM",
    "deviceName": "Riza Arif",
    "sender": "6283841502450",
    "status": "connected",
    "note": "ready to use",
    "timestamp": "2024-01-22T04:56:02.41114184Z"
}
             
```

```php
<?php
/**
* all data POST sent from  https://bdg.wablas.com
* you must create URL what can receive POST data
* we will sent data like this:
* sender = device number
* status = status of device - string
* deviceName = device Name - string
* deviceId = device ID - 
* note = response note - string
* timestamp = update status device timestamp
*/

$content = json_decode(file_get_contents('php://input'), true);

$status = $content['status'];
$deviceName = $content['deviceName'];
$sender = $content['sender'];
$deviceId = $content['deviceId'];

?>
```

###### Body Response:

sender

string

Device Number

status

string

Status device connected , disconnected

deviceName

string

Your device Name

deviceId

string

ID your device

note

string

note response, example : "ready to use", "whatsapp sender not connected, need scan qr code again".

timestamp

datetime

timestamp of update status device

#### Channel API

`POST https://bdg.wablas.com/api/channel/channel_name`  
Example :

```php
<?php
$curl = curl_init();
$token = "";
$channel = 'line'  //telegram,facebook,twitter
//text
$data = [
    'user_id' => 'Uabb3cc695269e10f43c57a709919867e',
    'message' => 'hello there',
];
//media message
$data = [
    'user_id' => 'Uabb3cc695269e10f43c57a709919867e',
    'message' => 'hello there',
    'type' => 'image' // video,audio,image
    'urlFile'=> "https://file-examples.com/storage/fef1706276640fa2f99a5a4/2017/10/file_example_JPG_100kB.jpg"
];

curl_setopt($curl, CURLOPT_HTTPHEADER,
    array(
        "Authorization: $token",
    )
);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($curl, CURLOPT_URL,  "https://bdg.wablas.com/api/channel/$channel");
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
$result = curl_exec($curl);
curl_close($curl);
print_r($result);
?>
```

###### Request parameters:

Authorization

Required

token can be found in the menu: Device - Settings https://bdg.wablas.com , Setting => Channel => Setting Channel

channel

Required

Channel that you one to use : available : telegram,line,facebook,twitter.

user\_id

Required

You can only retrieve the user ID from the webhook. However, for Twitter, you can obtain the user ID by using the 'GetID' feature in the Twitter Channel Settings.

message

Required

Text message to be sent. Format: UTF-8 or UTF-16 string. maximum character is 1024.

type

Required

Required if tou want to send Media Message (Image, Video, Audio)

urlFile

Required

URL of file to be sent. Make sure file has been uploaded on the server and can be accessed by the public. Required if tou want to send Media Message (Image, Video, Audio)