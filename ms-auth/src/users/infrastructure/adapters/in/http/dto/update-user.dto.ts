import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  apellido?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  celular?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipoUsuario?: string;
}
