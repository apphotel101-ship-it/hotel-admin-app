export type AdminUser = {
  admin_id: number;
  email: string;
  role: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  admin: AdminUser;
};

export type RefreshResponse = {
  access_token: string;
};
