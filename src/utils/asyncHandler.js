const asyncHandler = (requestHandler) => {              // Higher order function
    return (req,res,next) => {
        Promise
        .resolve(requestHandler(req,res,next))
        .catch((err) => next(err))
    }
}


export {asyncHandler}




//Method 2 :using HOFunction

// const asynccHandler = (fn) => async(req,res,next) => {
//     try {
//         await fn(req,res,next)

//     } catch (err) {
//         res
//         .status(err.code || 500)
//         .json({
//             success:false,
//             message : err.message
//         })
//     }
// }