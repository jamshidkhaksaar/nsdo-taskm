// Mock axios module
interface AxiosInstance {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
  interceptors: {
    request: {
      use: jest.Mock;
    };
    response: {
      use: jest.Mock;
    };
  };
  defaults: {
    headers: {
      common: Record<string, string>;
    };
  };
  create: jest.Mock<AxiosInstance>;
}

const mockAxios: AxiosInstance = {
  create: jest.fn(() => mockAxios) as jest.Mock<AxiosInstance>,
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
    },
    response: {
      use: jest.fn(),
    },
  },
  defaults: {
    headers: {
      common: {},
    },
  },
};

export default mockAxios; 