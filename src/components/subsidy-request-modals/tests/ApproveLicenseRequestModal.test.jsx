import React from 'react';
import {
  render,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import { ApproveLicenseRequestModal } from '../ApproveLicenseRequestModal';
import EnterpriseAccessApiService from '../../../data/services/EnterpriseAccessApiService';
import * as hooks from '../data/hooks';

const TEST_ENTERPRISE_UUID = 'test-enterprise-uuid';
const TEST_COURSE_RUN_ID = 'edx+101';
const TEST_SUBSCRIPTION_UUID = 'test-subscription-uuid';
const TEST_SUBSCRIPTION_UUID_2 = 'test-subscription-2-uuid';

jest.mock('../data/hooks');

jest.mock('../../../data/services/EnterpriseAccessApiService', () => ({
  approveLicenseRequest: jest.fn(),
}));

describe('<ApproveLicenseRequestModal />', () => {
  const basicProps = {
    enterpriseId: TEST_ENTERPRISE_UUID,
    licenseRequest: {
      uuid: 'test-license-request-uuid',
      courseId: TEST_COURSE_RUN_ID,
    },
    isOpen: true,
    onSuccess: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    hooks.useApplicableSubscriptions.mockReturnValue({
      applicableSubscriptions: [{
        uuid: TEST_SUBSCRIPTION_UUID,
        title: 'test-subscription',
        licenses: {
          unassigned: 3,
          total: 5,
        },
      },
      {
        uuid: TEST_SUBSCRIPTION_UUID_2,
        title: 'test-subscription-2',
        licenses: {
          unassigned: 3,
          total: 5,
        },
      },
      ],
      isLoading: false,
      error: undefined,
    });
  });

  it('should render skeleton if loading', () => {
    hooks.useApplicableSubscriptions.mockReturnValue({
      applicableSubscriptions: [],
      isLoading: true,
      error: undefined,
    });

    const { getByTestId } = render(
      <ApproveLicenseRequestModal {...basicProps} />,
    );

    expect(getByTestId('approve-license-request-modal-skeleton'));
  });

  it('should disable the approve button if no subscription has been selected', () => {
    const { getByTestId } = render(
      <ApproveLicenseRequestModal {...basicProps} />,
    );

    const approveBtn = getByTestId('approve-license-request-modal-approve-btn');
    expect(approveBtn.disabled).toBe(true);
  });

  it('should auto select subscription and hide choices if there is only one applicable subscription', async () => {
    hooks.useApplicableSubscriptions.mockReturnValue({
      applicableSubscriptions: [{
        uuid: TEST_SUBSCRIPTION_UUID,
        title: 'test-subscription',
        licenses: {
          unassigned: 3,
          total: 5,
        },
      }],
      isLoading: false,
      error: undefined,
    });

    const { getByTestId, queryByTestId } = render(
      <ApproveLicenseRequestModal {...basicProps} />,
    );

    expect(queryByTestId('approve-license-request-modal-subscription-0')).toBeNull();
    const approveBtn = getByTestId('approve-license-request-modal-approve-btn');

    await waitFor(() => {
      expect(approveBtn.disabled).toBe(false);
    });
  });

  it('should call Enterprise Access API to approve the request and call onSuccess afterwards', async () => {
    const handleSuccess = jest.fn();
    const { getByTestId } = render(
      <ApproveLicenseRequestModal {...basicProps} onSuccess={handleSuccess} />,
    );

    const subscriptionChoiceRadio = getByTestId('approve-license-request-modal-subscription-0');
    fireEvent.click(subscriptionChoiceRadio);

    const approveBtn = getByTestId('approve-license-request-modal-approve-btn');
    expect(approveBtn.disabled).toBe(false);

    await act(async () => { fireEvent.click(approveBtn); });

    expect(EnterpriseAccessApiService.approveLicenseRequest).toHaveBeenCalledWith({
      licenseRequestUUIDs: [basicProps.licenseRequest.uuid],
      subscriptionPlanUUID: TEST_SUBSCRIPTION_UUID,
    });
    expect(handleSuccess).toHaveBeenCalled();
  });

  it('should render alert if an error occured', async () => {
    EnterpriseAccessApiService.approveLicenseRequest.mockRejectedValue(new Error('something went wrong'));

    const { getByTestId } = render(
      <ApproveLicenseRequestModal {...basicProps} />,
    );

    const subscriptionChoiceRadio = getByTestId('approve-license-request-modal-subscription-0');
    fireEvent.click(subscriptionChoiceRadio);

    let approveBtn = getByTestId('approve-license-request-modal-approve-btn');
    expect(approveBtn.disabled).toBe(false);

    await act(async () => { fireEvent.click(approveBtn); });

    expect(EnterpriseAccessApiService.approveLicenseRequest).toHaveBeenCalledWith({
      licenseRequestUUIDs: [basicProps.licenseRequest.uuid],
      subscriptionPlanUUID: TEST_SUBSCRIPTION_UUID,
    });

    approveBtn = getByTestId('approve-license-request-modal-approve-btn');
    expect(getByTestId('approve-license-request-modal-error-alert'));
    expect(approveBtn.textContent).toBe('Try again');
  });

  it('should render alert if there are no applicable subscriptions', async () => {
    hooks.useApplicableSubscriptions.mockReturnValue({
      applicableSubscriptions: [],
      isLoading: false,
      error: undefined,
    });

    const { getByTestId } = render(
      <ApproveLicenseRequestModal {...basicProps} />,
    );

    expect(getByTestId('approve-license-request-modal-no-subscriptions-alert'));
  });
});
