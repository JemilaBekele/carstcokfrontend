/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from 'http';
import { axiosWithAuth } from './cli';
// Get User by ID !QAZxsw2
export const getUserById = async (req?: IncomingMessage) => {
  try {
    // usser id is get by backend
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.get(`/users/Usermy/data`);
    return response.data.user;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch user');
  }
};

// Update User by ID
export const updateUserById = async (
  userID: string,
  updatedData: Record<string, any>,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);

    const response = await axiosInstance.put(`/users/${userID}`, updatedData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update user');
  }
};

// Change Password
export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);

    const response = await axiosInstance.patch(`/users/change-password`, {
      currentPassword,
      newPassword
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to change password'
    );
  }
};
