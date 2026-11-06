import React from 'react';
import { PaymentManagementPage } from '../../components/PaymentManagementPage';

export const ManagerPaymentsPage: React.FC = () => (
  <PaymentManagementPage apiBase="/manager" />
);
