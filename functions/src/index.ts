/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import fetch from 'node-fetch'; 

import {
  createTestAccount,
  createTransport,
  getTestMessageUrl
} from "nodemailer";


// Start writing functions
// https://firebase.google.com/docs/functions/typescript

const GET_PHOTO_QUERY = `query GetPhotoById($id: uuid!){
  Default_photos_by_pk(id:$id){
    photo_url
    description
  }
}`;

// export const notifyAboutComment =  onRequest(async (request, response) => {
//   try {

//     const {event} = request.body; 
//     const {photo_id, comment} = event?.data?.new; 
//     const {session_variables} = event; 

//     const photoInfoQuery = await fetch("http://localhost:8080/v1/graphql",{
//       method: 'POST', 
//       body: JSON.stringify({
//         query: GET_PHOTO_QUERY, 
//         variables: {id: photo_id}
//       }), 
//       headers: {...session_variables, ...request.headers},
//     });


//     const { data: { Default_photos_by_pk: { photo_url, description } } } = await photoInfoQuery.json();

  
//     response.status(200).send({message: "success"})
//   } catch(error){
//     response.status(500).send({
//       // message: `Message: ${error.message}`
//       message: "failed"
//     }); 
//   }
//   logger.info("Request Body", request.body);
//   response.send("Hello from Firebase!");
// });


export const notifyAboutComment = onRequest(async (request, response) => {
  try {
    const { event } = request.body;
    const { photo_id, comment } = event?.data?.new;
    const { session_variables } = event;

    const photoInfoQuery = await fetch("http://localhost:8080/v1/graphql", {
      method: 'POST',
      body: JSON.stringify({
        query: GET_PHOTO_QUERY,
        variables: { id: photo_id }
      }),
      headers: { ...session_variables, ...request.headers },
    });
  // Explicitly define the type of the response
  //const photoInfoResponse: { data: { Default_photos_by_pk: { photo_url: string, description: string } } } = await photoInfoQuery.json();

  //const { photo_url, description } = photoInfoResponse.data.Default_photos_by_pk;
    const { data: { Default_photos_by_pk: { photo_url, description } } } = await photoInfoQuery.json();

    const testAccount = await createTestAccount(); 
    const transporter = createTransport({
      host: "smtp.ethereal.email", 
      port: 587,
      secure: false,
      auth:{
        user: testAccount.user,
        pass: testAccount.pass
      }
    }); 

    const sentEmail = await transporter.sendMail({
      from: `"Firebase Function" <${testAccount.user}>`, 
      to: "opherlabs@gmail.com", 
      subject: "new Comment to the Photo", 
      html: ` 
       <html> 
          <head>head> 
          <body> 
          <h1>Hi there!</h1> 
          <br><br> 
          <p> You have got a new comment to your photo: <a href="${photo_url}">${description}</p> 
          <p>The Comment text is: <i>${comment}</i></p> 
          </body> 
         
       </html> 
     
     ` 
     })
    logger.log(getTestMessageUrl(sentEmail)); 

    response.status(200).send({ message: "success" });
  } catch (error) {
    console.error("Error processing request:", error);
    response.status(500).send({
      message: "failed",
      //error: error.message, // Include the error message in the response
    });
  }

  logger.info("Request Body", request.body);
});
