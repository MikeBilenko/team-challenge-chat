// export const authorizeSocketForRole = (role) => {
//   return (socket, next) => {
//     const user = socket.user;

//     if (!user || Roles.compareRoles(role, user.role) < 0) {
//       next(Error(403, "You don't have access to this action!"));
//     } else {
//       next();
//     }
//   }
// };