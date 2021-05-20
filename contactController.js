// contactController.js
// Import contact model
Contact = require('./contactModel');
const axios = require('axios');
 const nodemailer = require('nodemailer');
let transport = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
       user: '',
       pass: ''
    }
}); 

const callslotapi = async (PINCODE,DATE) => {
  try {
 console.log('https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode='+PINCODE+'&date='+DATE);
    return await axios.get('https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode='+PINCODE+'&date='+DATE ,{headers: {"Access-Control-Allow-Origin": "*", crossorigin:true, "Access-Control-Allow-Credentials" : true}})
  } catch (error) {
	  console.log("sac error");
    console.error( (error));
  }
}


const fetchData = async (PINCODE,DATE,more45,less45) => {
	
	const slots = await callslotapi(PINCODE,DATE);
	 console.log(slots);
	 let data=JSON.parse(slots.body);
      
	if( data.sessions && !data.sessions.length ) {
    //handler either not an array or empty array
	console.log("empty slots for "+PINCODE );
	  // update status=2 as no hospital then again make 0 once all other pincode complete
		 Contact.find({  pincode:  PINCODE , status:0 }, function (err, contact) {
        if (err)
            return err;
		   // list of user to send mail
        	contact.forEach(element => {
				//console.log(element);
 
		  
		   // update status=2 means today we sent
	 Contact.findById(element._id, function (err, contact) {
        if (err)
            return err;
    
        contact.status = 2;
// save the contact and check for errors
        contact.save(function (err) {
            if (err)
                return err;
           return 'Contact Info updated';
        });
    });

});
    });
	
}else
{
	 console.log('inner'+more45);
	//console.log(data.sessions);

      let sessions = data.sessions;
      //console.log(slots);
      let validSlots45 = sessions.filter(slot => slot.min_age_limit <= 45 && slot.available_capacity > 0 && more45>=1)
	  let validSlots18 = sessions.filter(slot => slot.min_age_limit <= 18 && slot.available_capacity > 0 && less45>=1)
        // console.log({  validSlots: validSlots18.length})
      if (validSlots45.length > 0) {
        // send mail here for 45
		sendmail(PINCODE,DATE,45,sessions[0].name+" "+sessions[0].address,validSlots45.length);
		console.log("hospital for 45 age available "+PINCODE);
      }
	  else if (validSlots18.length > 0) {
        // send mail here for 18
		sendmail(PINCODE,DATE,18,sessions[0].name+" "+sessions[0].address,validSlots18.length);
		console.log("hospital for 18 age available "+PINCODE);
      }
	  else{
		 console.log("no hospital");
		 
	
	  }
	  
	 
    
} 
	
  };
  
  const sendmail =   (PINCODE,DATE,agelimit,hospital,totalavail_hospital) => {
	  Contact.find({  pincode:  PINCODE , age: { $gte: agelimit }, status:0 }, function (err, contact) {
        if (err)
            return err;
		   // list of user to send mail
        	contact.forEach(element => {
				//console.log(element);
          console.log("send to "+element.email+" for pincode "+element.pincode+" of age "+element.age+" in hospital  "+hospital+". Total hospital available : "+totalavail_hospital);
		  
		   // update status=2 means today we sent
	 Contact.findById(element._id, function (err, contact) {
        if (err)
            return err;
    
        contact.status = 2;
// save the contact and check for errors
        contact.save(function (err) {
            if (err)
                return err;
           return 'Contact Info updated';
        });
    });
   
        const message = {
    from: 'info@sender.in', // Sender address
    to: 'from@gmail.com',         // List of recipients
    subject: 'Vaccine Alert - Total hospital available : '+totalavail_hospital, // Subject line
    html: "Dear User,<br><br>We send this alert to "+element.email+" for pincode "+element.pincode+" of age "+element.age+" to notify that in hospital  "+hospital+" vaccine slot is available.<br><Br> Total hospital available : "+totalavail_hospital+"<br><Br>Please visit cowin.gov.in and register your slot asap." // Plain text body
};
 transport.sendMail(message, function(err, info) {
    if (err) {
      console.log(err)
    } else {
      console.log(info);
    }
}); 
	 
	 
  
});
    });
  };
  
// Handle index actions
exports.index = function (req, res) {
    Contact.get(function (err, contacts) {
        if (err) {
            res.json({
                status: "error",
                message: err,
            });
        }
        res.json({
            status: "success",
            message: "Contacts retrieved successfully",
            data: contacts
        });
    });
};
// Handle create contact actions
exports.new = function (req, res) {
    var contact = new Contact();
    contact.pincode = req.body.pincode  ;
    contact.age = req.body.age;
    contact.email = req.body.email;
    contact.status = req.body.status;
// save the contact and check for errors
    contact.save(function (err) {
        // Check for validation error
        if (err)
            res.json(err);
        else
            res.json({
                message: 'New contact created!',
                data: contact
            });
    });
};
// Handle view contact info
exports.view = function (req, res) {
	let myage = req.params.age? req.params.age :18;
    
	Contact.aggregate([
	{"$match" : { status : 0}},
    {"$group" : {_id:{pincode:"$pincode"   } ,   more45:{$sum:{ $cond: [ { $gte: [ "$age", 45] } , 1, 0 ]}},   less45:{$sum:{ $cond: [ { $lte: [ "$age", 44] } , 1, 0 ]}}}},
	
    {$sort:{"create_date":-1}},
    { "$limit": 1 }
    
],function(error, data){
    if (error)
            res.send(error);
		
		//console.log(data[0]._id.pincode);
		 var currentDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
var day = currentDate.getDate()
var month = currentDate.getMonth() + 1
var year = currentDate.getFullYear()
const tomorrow=day + "-" + month + "-" + year;
  if(data.length){
		data.forEach(element => {
  console.log(element._id.pincode);
  
console.log(tomorrow);
  fetchData(element._id.pincode,tomorrow,element.more45,element.less45);
  
});

        res.json({
            message: 'Contact details loading..',
            data: data,
			date: tomorrow
        });
  }
  else{
	  
	  // update status=2 as no hospital then again make 0 once all other pincode complete
		 Contact.find({    status:2 }, function (err, contact) {
        if (err)
            return err;
		   // list of user to send mail
        	contact.forEach(element => {
				//console.log(element);
 
		  
		   // update status=2 means today we sent
	 Contact.findById(element._id, function (err, contact) {
        if (err)
            return err;
    
        contact.status = 0;
// save the contact and check for errors
        contact.save(function (err) {
            if (err)
                return err;
           return 'Contact Info updated';
        });
    });

});
    });
	
	  res.json({
            message: 'No Contact details loading..',
            data: data,
			date: tomorrow
        });
  }
});
};
// Handle update contact info
exports.update = function (req, res) {
    Contact.findById(req.params.pincode, function (err, contact) {
        if (err)
            res.send(err);
        contact.pincode = req.body.pincode;
        contact.age = req.body.age;
        contact.email = req.body.email;
        contact.status = req.body.status;
// save the contact and check for errors
        contact.save(function (err) {
            if (err)
                res.json(err);
            res.json({
                message: 'Contact Info updated',
                data: contact
            });
        });
    });
};

// Handle delete contact
exports.delete = function (req, res) {
    Contact.remove({
        email: req.params.pincode
    }, function (err, contact) {
        if (err)
            res.send(err);
        res.json({
            status: "success",
            message: 'Contact deleted'
        });
    });
};