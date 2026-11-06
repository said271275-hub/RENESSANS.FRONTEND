import React from 'react';
import { PaymentManagementPage } from '../../components/PaymentManagementPage';

export const AdminPaymentsPage: React.FC = () => (
  <PaymentManagementPage apiBase="/admin" />
);
