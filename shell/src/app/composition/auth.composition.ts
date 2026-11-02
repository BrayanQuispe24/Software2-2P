import { axiosClient } from '../../shared/infrastructure/http/axiosClient';
import { AuthAxiosRepository } from '../../features/auth/infrastructure/AuthAxiosRepository';
import { GetSessionUseCase } from '../../features/auth/application/GetSessionUseCase';
import { StartLoginUseCase } from '../../features/auth/application/StartLoginUseCase';
import { LogoutUseCase } from '../../features/auth/application/LogoutUseCase';

const authRepository = new AuthAxiosRepository(axiosClient);

export const getSessionUseCase = new GetSessionUseCase(authRepository);
export const startLoginUseCase = new StartLoginUseCase(authRepository);
export const logoutUseCase = new LogoutUseCase(authRepository);
