import { renderHook } from '@testing-library/react-hooks/dom';
import { useApplicableCatalogs, useApplicableSubscriptions, useApplicableCoupons } from '../data/hooks';
import EnterpriseCatalogApiService from '../../../data/services/EnterpriseCatalogApiService';
import EcommerceApiService from '../../../data/services/EcommerceApiService';

const TEST_ENTERPRISE_UUID = 'test-enterprise-uuid';
const TEST_COURSE_RUN_IDS = ['edx+101'];
const TEST_CATALOG_UUID = 'test-catalog-uuid';

jest.mock('../../../data/services/EnterpriseCatalogApiService', () => ({
  fetchApplicableCatalogs: jest.fn(() => ({
    data: {
      catalog_list: [TEST_CATALOG_UUID],
    },
  })),
}));

jest.mock('../../../data/services/EcommerceApiService', () => ({
  fetchCoupon: jest.fn((couponId) => ({
    data: {
      id: couponId,
      max_uses: 3,
    },
  })),
}));

describe('useApplicableCatalogs', () => {
  afterEach(() => jest.clearAllMocks());

  it('should fetch catalogs containing given the course runs', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useApplicableCatalogs({
      enterpriseId: TEST_ENTERPRISE_UUID,
      courseRunIds: TEST_COURSE_RUN_IDS,
    }));
    await waitForNextUpdate();
    expect(EnterpriseCatalogApiService.fetchApplicableCatalogs).toHaveBeenCalledWith(
      {
        enterpriseId: TEST_ENTERPRISE_UUID,
        courseRunIds: TEST_COURSE_RUN_IDS,
      },
    );
    expect(result.current.applicableCatalogs).toEqual([TEST_CATALOG_UUID]);
  });

  it('should handle errors', async () => {
    const error = new Error('something went wrong');
    EnterpriseCatalogApiService.fetchApplicableCatalogs.mockRejectedValueOnce(error);

    const { result, waitForNextUpdate } = renderHook(() => useApplicableCatalogs({
      enterpriseId: TEST_ENTERPRISE_UUID,
      courseRunIds: TEST_COURSE_RUN_IDS,
    }));

    await waitForNextUpdate();
    expect(result.current.error).toEqual(error);
  });
});

describe('useApplicableSubscriptions', () => {
  const subscriptions = {
    results: [{
      uuid: 'test-subscription-1',
      enterpriseCatalogUuid: TEST_CATALOG_UUID,
      licenses: {
        unassigned: 1,
      },
    },
    {
      uuid: 'test-subscription-2',
      enterpriseCatalogUuid: TEST_CATALOG_UUID,
      licenses: {
        unassigned: 0,
      },
    },
    {
      uuid: 'test-subscription-2',
      enterpriseCatalogUuid: 'abc',
      licenses: {
        unassigned: 1,
      },
    }],
  };

  afterEach(() => jest.clearAllMocks());

  it('should return all subscriptions with a catalog containing the given course runs', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useApplicableSubscriptions({
      enterpriseId: TEST_ENTERPRISE_UUID,
      courseRunIds: TEST_COURSE_RUN_IDS,
      subscriptions,
    }));

    await waitForNextUpdate();
    expect(EnterpriseCatalogApiService.fetchApplicableCatalogs).toHaveBeenCalledWith(
      {
        enterpriseId: TEST_ENTERPRISE_UUID,
        courseRunIds: TEST_COURSE_RUN_IDS,
      },
    );
    const { applicableSubscriptions } = result.current;
    expect(applicableSubscriptions.length).toEqual(1);
    expect(applicableSubscriptions[0]).toEqual(subscriptions.results[0]);
  });

  it('should handle errors', async () => {
    const error = new Error('something went wrong');
    EnterpriseCatalogApiService.fetchApplicableCatalogs.mockRejectedValueOnce(error);

    const { result, waitForNextUpdate } = renderHook(() => useApplicableCatalogs({
      enterpriseId: TEST_ENTERPRISE_UUID,
      courseRunIds: TEST_COURSE_RUN_IDS,
    }));

    await waitForNextUpdate();
    expect(result.current.error).toEqual(error);
  });
});

describe('useApplicableCoupons', () => {
  const couponOrders = {
    results: [{
      id: 1,
      numUnassigned: 1,
      enterpriseCustomerCatalog: TEST_CATALOG_UUID,
    },
    {
      id: 2,
      numUnassigned: 1,
      enterpriseCustomerCatalog: 'abc',
    }],
  };

  afterEach(() => jest.clearAllMocks());

  it('should return all coupons with a catalog containing the given course runs', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useApplicableCoupons({
      enterpriseId: TEST_ENTERPRISE_UUID,
      courseRunIds: TEST_COURSE_RUN_IDS,
      coupons: couponOrders,
    }));

    await waitForNextUpdate();
    expect(EnterpriseCatalogApiService.fetchApplicableCatalogs).toHaveBeenCalledWith(
      {
        enterpriseId: TEST_ENTERPRISE_UUID,
        courseRunIds: TEST_COURSE_RUN_IDS,
      },
    );

    expect(EcommerceApiService.fetchCoupon).toHaveBeenCalledTimes(2);
    expect(EcommerceApiService.fetchCoupon).toHaveBeenCalledWith(1);
    expect(EcommerceApiService.fetchCoupon).toHaveBeenCalledWith(2);

    const { applicableCoupons } = result.current;
    expect(applicableCoupons.length).toEqual(1);
    expect(applicableCoupons[0]).toEqual({
      ...couponOrders.results[0],
      maxUses: 3,
    });
  });

  it('should handle errors fetching applicable catalogs', async () => {
    const error = new Error('something went wrong fetching applicable catalogs');
    EnterpriseCatalogApiService.fetchApplicableCatalogs.mockRejectedValueOnce(error);

    const { result, waitForNextUpdate } = renderHook(() => useApplicableCoupons({
      enterpriseId: TEST_ENTERPRISE_UUID,
      courseRunIds: TEST_COURSE_RUN_IDS,
      coupons: couponOrders,
    }));

    await waitForNextUpdate();
    expect(result.current.error).toEqual(error);
  });

  it('should handle errors fetching coupons', async () => {
    const error = new Error('something went wrong fetching coupons');
    EcommerceApiService.fetchCoupon.mockRejectedValueOnce(error);

    const { result, waitForNextUpdate } = renderHook(() => useApplicableCoupons({
      enterpriseId: TEST_ENTERPRISE_UUID,
      courseRunIds: TEST_COURSE_RUN_IDS,
      coupons: couponOrders,
    }));

    await waitForNextUpdate();
    expect(result.current.error).toEqual(error);
  });
});
