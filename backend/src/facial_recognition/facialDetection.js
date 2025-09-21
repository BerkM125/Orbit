// const faceapi = require('@vladmandic/face-api');
// const canvas = require('canvas');
// const fetch = require('node-fetch');
// const path = require('path');
// const { createCanvas, Image } = canvas;
// faceapi.env.monkeyPatch({ fetch, Image });

// // Cache for loaded models to avoid reloading
// let modelsLoaded = false;

// // Load all required face-api models
// async function loadModels() {
//     if (modelsLoaded) return;

//     const modelPath = path.join(__dirname, 'models');
//     console.log('Loading models from:', modelPath);
    
//     try {
//         await Promise.all([
//             faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath),
//             faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
//             faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath),
//             // Additional models available but not required for basic face matching
//             // faceapi.nets.ageGenderNet.loadFromDisk(modelPath),
//             // faceapi.nets.faceExpressionNet.loadFromDisk(modelPath),
//             // faceapi.nets.faceLandmark68TinyNet.loadFromDisk(modelPath),
//             // faceapi.nets.mtcnn.loadFromDisk(modelPath),
//             // faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath)
//         ]);
//         console.log('All models loaded successfully');
//         modelsLoaded = true;
//     } catch (error) {
//         console.error('Error loading models:', error);
//         throw error;
//     }
// }

// // Helper function to load and process an image from URL
// async function loadImage(url) {
//     const response = await fetch(url);
//     const buffer = await response.buffer();
//     const image = new Image();
//     image.src = buffer;
//     return image;
// }

// // Helper function to detect faces and compute descriptors
// async function getFaceDescriptor(image) {
//     try {
//         const detections = await faceapi
//             .detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
//             .withFaceLandmarks()
//             .withFaceDescriptor();
        
//         if (!detections) {
//             console.log('No face detected in image');
//             return null;
//         }

//         return detections.descriptor;
//     } catch (error) {
//         console.error('Error getting face descriptor:', error);
//         return null;
//     }
// }

// /**
//  * Find the best matching photo from a list of user profiles
//  * @param {string} inputPhotoUrl - URL of the input photo to match against
//  * @param {Array} userProfiles - Array of user profiles containing headshot_image URLs
//  * @returns {Object|null} The best matching user profile or null if no match found
//  */
// async function findMatchingPhoto(inputPhotoUrl, userProfiles) {
//     try {
//         // Ensure models are loaded
//         await loadModels();

//         // Load and process input photo
//         const inputImage = await loadImage(inputPhotoUrl);
//         const inputDescriptor = await getFaceDescriptor(inputImage);

//         if (!inputDescriptor) {
//             console.error('No face detected in input photo');
//             return null;
//         }

//         // Process each user's headshot and find best match
//         let bestMatch = {
//             user: null,
//             distance: Infinity
//         };

//         for (const user of userProfiles) {
//             try {
//                 if (!user.headshot_image) continue;

//                 const headshotImage = await loadImage(user.headshot_image);
//                 const headshotDescriptor = await getFaceDescriptor(headshotImage);

//                 if (!headshotDescriptor) {
//                     console.warn(`No face detected in headshot for user: ${user.id}`);
//                     continue;
//                 }

//                 // Calculate Euclidean distance between face descriptors
//                 const distance = faceapi.euclideanDistance(inputDescriptor, headshotDescriptor);

//                 // Update best match if this distance is smaller
//                 // Threshold of 0.6 is commonly used for face recognition
//                 if (distance < bestMatch.distance && distance < 0.6) {
//                     bestMatch = {
//                         user,
//                         distance
//                     };
//                 }
//             } catch (err) {
//                 console.error(`Error processing headshot for user ${user.id}:`, err);
//                 continue;
//             }
//         }

//         if (bestMatch.user) {
//             return {
//                 ...bestMatch.user,
//                 matchConfidence: 1 - (bestMatch.distance / 0.6) // Convert distance to confidence score
//             };
//         }

//         return null;
//     } catch (error) {
//         console.error('Error in findMatchingPhoto:', error);
//         throw error;
//     }
// }

// // Optional: Function to verify if an image contains a valid face
// async function validateFaceImage(imageUrl) {
//     try {
//         await loadModels();
//         const image = await loadImage(imageUrl);
//         const detection = await faceapi.detectSingleFace(image);
//         return !!detection;
//     } catch (error) {
//         console.error('Error validating face image:', error);
//         return false;
//     }
// }

// module.exports = {
//     findMatchingPhoto,
//     validateFaceImage
// };
