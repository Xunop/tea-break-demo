import { apis } from ".";
import type { Comment, Paper, PaperStats, Reporter, User } from "./types";
import qs from "querystring";

/**
 * Fetch all papers
 */
export function fetchPapers() {
  return apis.post("/api/Papers/GetAllPapers");
}

/**
 * Fetch a paper
 * Note: The OpenAPI spec doesn't have a specific endpoint for fetching a single paper
 * @param {string} paperId - ID of the paper
 */
export function fetchPaper(paperId: string) {
  // Assuming you might need to modify the implementation
  return apis.get(`/api/Papers/GetPaperById`, { params: { paperId } });
}

/**
 * Upload a new paper (Admin/Reporter)
 * @param {Paper} paper - Paper information
 * @param {File} [paperFile] - Optional paper file
 */
export function uploadPaper(paper: Paper, paperFile?: File) {
  const formData = new FormData();

  // Add paper details to form data
  formData.append("title", paper.title);
  formData.append("conference", paper.conference);

  formData.append("attachmentTag", "0");

  // Add paper file if provided
  if (paperFile) {
    formData.append("paperFile", paperFile);
  }

  // Optional: Add paperId for editing
  if (paper.id) {
    formData.append("paperId", paper.id.toString());
  }

  return apis.post("/api/Papers/SavePapers", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/**
 * Edit an existing paper (Admin)
 * @param {number} paperId - ID of the paper
 * @param {Paper} paper - Updated paper information
 * @param {File} [paperFile] - Optional updated paper file
 * @returns {Promise<void>} Confirmation of paper update
 */
export function editPaper(paperId: number, paper: Paper, paperFile?: File) {
  return uploadPaper({ ...paper, id: paperId }, paperFile);
}

/**
 * Delete a paper (Admin)
 * @param {string} paperId - ID of the paper
 */
export function deletePaper(paperId: string) {
  return apis.post("/api/Papers/DeletePaper", qs.stringify({ paperId }));
}

/**
 * Get User information
 * @param {string} id - ID of the user
 */
export function getUser(id: string) {
  // Note: The OpenAPI spec has a GetAllUsers endpoint
  return apis.get("/api/Users/GetInfoById", { params: { id } });
}

/**
 * Get user information by email
 * @param {string} email - Email of the user
 */
export function getUserByEmail(email: string) {
  return apis.get("/api/Users/GetInfoByEmail", { params: { email } });
}

/**
 * Register a new user
 * @param {User} user - User information
 * @param {string} emailCode - Email verification code
 */
export function registerUser(user: User, emailCode: string) {
  return apis.post(
    "/api/Users/UserRegister",
    qs.stringify({
      username: user.username,
      email: user.email,
      password: user.password,
      emailCode: emailCode,
    }),
  );
}

/**
 * Delete a user (Admin)
 * @param {number} userId - ID of the user
 */
export function deleteUser(userId: number) {
  // return apis.post("/api/Users/DeleteUser", qs.stringify({ userId }));
}

/**
 * Ban a user (Admin)
 * @param {number} userId - ID of the user
 * @param {string} datetime - Ban expiration date
 */
export function banUser(userId: number, datetime: string) {
  return apis.post("/api/Users/Mute", qs.stringify({ userId, datetime }));
}

/**
 * Fetch paper comments (User)
 * @param {string} paperId - ID of the paper
 */
export function fetchComments(paperId: string) {
  return apis.get("/api/comments/GetAllCommentList", { params: { paperId } });
}

/**
 * Add a comment to a paper (User)
 * @param {string} paperId - ID of the paper
 * @param {Comment} comment - Comment to be added
 */
export function addCommentToPaper(paperId: string, comment: string) {
  return apis.post(
    "/api/comments/AddPaperComment",
    qs.stringify({
      paperId,
      content: comment,
    }),
  );
}

/**
 * Add Child Comment
 * @param {number} paperId - ID of the paper
 * @param {number} parentCommentId - ID of parent comment
 * @param {string} content - Comment content
 */
export function addChildComment(
  paperId: number,
  parentCommentId: number,
  content: string,
) {
  return apis.post(
    "/api/comments/AddChildComment",
    qs.stringify({
      paperId,
      pid: parentCommentId,
      content,
    }),
  );
}

/**
 * Delete Comment
 * @param {string} commentId - ID of comment to delete
 * @returns {Promise<void>} Comment deletion confirmation
 */
export function deleteComment(commentId: string): Promise<void> {
  return apis.post("/api/comments/DeleteComment", { commentId });
}

/**
 * Download a paper (User)
 * @param {number} paperId - ID of the paper
 * @param {number} type - Type of the paper
 */
export function downloadPaper(paperId: number, type: number) {
  return apis.get("/api/Papers/Download", {
    params: { paperId, type },
    responseType: "blob", // Ensure the response is treated as binary data
  });
}

/**
 * Register a new conference reporter
 * @param {Reporter} reporter - Reporter information
 * @param {number} fileTag - 0 for no attachment, 1 for with attachment
 */
export function registerReporter(applyNote: string, fileTag: number = 0) {
  return apis.post(
    "/api/ReporterApply/ReporterRegister",
    qs.stringify({
      applyNote: applyNote.toString(),
      fileTag: fileTag.toString(),
    }),
  );
}

/**
 * Approve a reporter registration (Admin)
 * @param {string} reporterId - ID of the reporter
 * @param {number} status - 1 for approve, 2 for reject
 */
export function approveReporter(reporterId: string, status: number = 1) {
  return apis.post(
    "/api/ReporterApply/ApproveRegister",
    qs.stringify({
      id: reporterId,
      status: status.toString(),
    }),
  );
}

/**
 * Upload a paper by a reporter
 * @param {Paper} paper - Paper information
 * @param {File} [paperFile] - Optional paper file
 */
export function uploadPaperByReporter(paper: Paper, paperFile?: File) {
  return uploadPaper(paper, paperFile);
}

/**
 * Get all papers uploaded by a reporter
 * @param {string} reporterId - ID of the reporter
 * @returns {Promise<Paper[]>} List of papers uploaded by the reporter
 */
export function getPapersByReporter(reporterId: string): Promise<Paper[]> {
  // This endpoint is not explicitly defined in the OpenAPI spec
  // You might need to adjust based on actual backend implementation
  return fetchPapers();
}

/**
 * Change User Password
 * @param {string} email - User email
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<void>} Password change confirmation
 */
export function changeUserPassword(
  email: string,
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  return apis.post("/api/Users/UserAlterPassword", {
    email,
    oldPassword,
    newPassword,
  });
}

/**
 * Send Email Verification Code
 * @param {string} targetEmail - Email to send verification code
 * @param {string} imageCode - Image verification code
 * @param {string} subject - Email subject
 * @param {string} content - Email content
 */
export function sendEmailVerificationCode(
  targetEmail: string,
  imageCode: string,
  subject: string,
  content: string,
) {
  return apis.post(
    "/api/Users/SendEmailCode",
    qs.stringify({
      targetEmail,
      imageCode,
      subject,
      content,
    }),
  );
}

/**
 * Get Image Verification Code
 * @param {string} email - Email to generate the image code for
 */
export async function getImageVerificationCode(email: string) {
  return apis.get("/api/Users/GetImageCode", { params: { email } });
}

/**
 * Get All Users
 */
export function getAllUsers() {
  return apis.get("/api/Users/GetAllUsers");
}

/**
 * Add a friend (User)
 * @param {string} friendId - ID of the friend to be added
 * @param {string} [message] - Optional message with friend request
 */
export function addFriend(friendId: string, message?: string) {
  return apis.post("/api/friendRequests/ApplyFriend", {
    friendId,
    message: message || "",
  });
}

/**
 * Add friend by email
 * @param {string} email - Email of the friend to be added
 * @param {string} [message] - Optional message with friend request
 */
export function addFriendByEmail(email: string, message?: string) {
  return apis.post(
    "/api/friendRequests/ApplyFriendByEmail",
    qs.stringify({
      email,
      message: message || "",
    }),
  );
}

/**
 * Add Follow
 * @param {string} userId - ID of user to follow
 */
export function addFollow(userId: string) {
  return apis.post("/api/friends/AddFollow", { userId });
}

/**
 * Cancel Follow
 * @param {string} userId - ID of user to unfollow
 */
export function cancelFollow(userId: string) {
  return apis.post("/api/friends/CancelFollow", { userId });
}

/**
 * Get All Follow List
 */
export function getAllFollowList() {
  return apis.get("/api/friends/GetAllFollowList");
}

/**
 * Get All Friend List
 */
export function getAllFriendList() {
  return apis.get("/api/friends/GetAllFriendList");
}

/**
 * Delete Friend
 * @param {string} friendId - ID of friend to delete
 */
export function deleteFriend(friendId: string) {
  return apis.post("/api/friends/DeleteFriend", qs.stringify({ friendId }));
}

/**
 * Get Friend Request List
 */
export function getFriendRequestList() {
  return apis.get("/api/friendRequests/GetApplyFriendList");
}

/**
 * Get Received Friend Request List
 */
export function getReceivedFriendRequestList() {
  return apis.get("/api/friendRequests/GetReceivedApplyList");
}

/**
 * Handle Friend Request
 * @param {string} applyId - ID of friend request
 * @param {number} status - 1 for accept, 2 for reject
 */
export function handleFriendRequest(applyId: string, status: number) {
  return apis.post(
    "/api/friendRequests/HandleFriendApply",
    qs.stringify({
      applyId,
      status: status.toString(),
    }),
  );
}

/**
 * Upload Temporary File (for paper attachments)
 * @param {File} attachment - File to upload
 * @returns {Promise<string>} Uploaded file identifier
 */
export function uploadTemporaryPaperFile(attachment: File): Promise<string> {
  const formData = new FormData();
  formData.append("attachment", attachment);

  return apis.post("/api/Papers/UploadTempFile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/**
 * Upload Temporary File (for reporter application)
 * @param {File} attachment - File to upload
 * @returns {Promise<string>} Uploaded file identifier
 */
export function uploadTemporaryReporterFile(attachment: File): Promise<string> {
  const formData = new FormData();
  formData.append("attachment", attachment);

  return apis.post("/api/ReporterApply/UploadTempFile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/**
 * Get All Reporter Registration Requests (Admin)
 */
export function getAllReporterRegistrationRequests() {
  return apis.get("/api/ReporterApply/GetAllRegisterList");
}

/**
 * Get paper view statistics
 */
export function getPaperViewStatistics(paperId: number) {
  return apis.get("/api/PaperStatus/GetViewCount", { params: { paperId } });
}

/**
 * Set paper view statistics
 */
export function setPaperViewStatistics(paperId: number) {
  return apis.post("/api/PaperStatus/AddViewCount", qs.stringify({ paperId }));
}

/**
 * Get paper download statistics
 */
export function getPaperDownloadStatistics(paperId: number) {
  return apis.get("/api/PaperStatus/GetDownloadCount", { params: { paperId } });
}

/** Set paper download statistics */
export function setPaperDownloadStatistics(paperId: number) {
  return apis.post("/api/PaperStatus/AddDownloadCount", qs.stringify({ paperId }));
}

/**
 * Get specific user's paper
 * @param {string} userId - ID of the user
 */
export function getUserPapers(userId: string) {
  return apis.get("/api/Papers/GetUserPaperListByPage", { params: { userId } });
}

/**
 * Related paper and authors
 * @param {string} paperId - ID of the paper
 * @param {string} userIds - IDs of the author
 */
export function relatedPaperAndAuthors(paperId: string, userIds: string) {
  return apis.post(
    "/api/PaperAuthor/Add",
    qs.stringify({ paperId, userIds }),
  );
}

/**
 * Get all paper authors
 * @param {string} paperId - ID of the paper
 */
export function getPaperAuthors(paperId: string) {
  return apis.get("/api/PaperAuthor/GetAuthorList", { params: { paperId } });
}
