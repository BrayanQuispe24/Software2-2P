import { axiosClient } from '../../shared/infrastructure/http/axiosClient';
import { UsersAxiosRepository } from '../../features/users/infrastructure/UsersAxiosRepository';
import { GetUsersUseCase } from '../../features/users/application/GetUsersUseCase';
import { CreateUserUseCase } from '../../features/users/application/CreateUserUseCase';
import { UpdateUserUseCase } from '../../features/users/application/UpdateUserUseCase';
import { DeactivateUserUseCase } from '../../features/users/application/DeactivateUserUseCase';

const usersRepository = new UsersAxiosRepository(axiosClient);

export const getUsersUseCase = new GetUsersUseCase(usersRepository);
export const createUserUseCase = new CreateUserUseCase(usersRepository);
export const updateUserUseCase = new UpdateUserUseCase(usersRepository);
export const deactivateUserUseCase = new DeactivateUserUseCase(usersRepository);
