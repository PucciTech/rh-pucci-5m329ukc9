import pb from '@/lib/pocketbase/client'

export type Role = 'champion' | 'analyst' | 'finance' | 'homologator' | 'none'

export interface UserSession {
  id: string
  email: string
  name: string
  role: Role
  token?: string
}

export interface Department {
  id: string
  name: string
  code: string
  description: string
  color: string
  created?: string
  updated?: string
}

export type EmployeeStatus = 'active' | 'inactive' | 'on_leave'

export interface Employee {
  id: string
  name: string
  email: string
  role_title: string
  department_id: string
  department_name: string
  status: EmployeeStatus
  admission_date: string
  phone: string
  cpf: string
  notes?: string
  created?: string
  updated?: string
}

// Chaves de armazenamento
const LOCAL_USERS_KEY = 'rh_pucci_custom_users'
const LOCAL_SESSION_KEY = 'rh_pucci_active_session'
const LOCAL_DEPTS_KEY = 'rh_pucci_departments'
const LOCAL_EMPLOYEES_KEY = 'rh_pucci_employees'

// Departamentos Iniciais Padrão
const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-operacoes',
    name: 'Operações Ambientais',
    code: 'OP-AMB',
    description: 'Gestão de resíduos, coleta e operações técnicas em campo.',
    color: '#059669', // Emerald
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'dept-rh',
    name: 'Recursos Humanos',
    code: 'RH-CORP',
    description: 'Gestão de pessoas, recrutamento, benefícios e departamento pessoal.',
    color: '#2563eb', // Blue
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'dept-financeiro',
    name: 'Financeiro & Controladoria',
    code: 'FIN-CTR',
    description: 'Contas a pagar/receber, conciliação bancária e controladoria.',
    color: '#7c3aed', // Purple
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'dept-engenharia',
    name: 'Engenharia & Projetos',
    code: 'ENG-PRJ',
    description: 'Licenciamento ambiental, relatórios de impacto e projetos industriais.',
    color: '#d97706', // Amber
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'dept-comercial',
    name: 'Comercial & Novos Negócios',
    code: 'COM-NEG',
    description: 'Atendimento a clientes corporativos e expansão de contratos.',
    color: '#0891b2', // Cyan
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
]

// Colaboradores Iniciais Padrão
const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'Marcela Pucci',
    email: 'marcela@pucciambiental.com.br',
    role_title: 'Diretora de RH & Pessoas',
    department_id: 'dept-rh',
    department_name: 'Recursos Humanos',
    status: 'active',
    admission_date: '2021-03-15',
    phone: '(11) 98765-4321',
    cpf: '123.456.789-00',
    notes: 'Liderança executiva do departamento de pessoas e cultura interna.',
    created: '2021-03-15T08:00:00.000Z',
    updated: new Date().toISOString(),
  },
  {
    id: 'emp-2',
    name: 'Carlos Eduardo Santos',
    email: 'carlos.santos@pucciambiental.com.br',
    role_title: 'Engenheiro Ambiental Pleno',
    department_id: 'dept-engenharia',
    department_name: 'Engenharia & Projetos',
    status: 'active',
    admission_date: '2022-06-01',
    phone: '(11) 97123-5544',
    cpf: '234.567.890-11',
    notes: 'Especialista em licenciamento e gestão de efluentes industriais.',
    created: '2022-06-01T08:00:00.000Z',
    updated: new Date().toISOString(),
  },
  {
    id: 'emp-3',
    name: 'Fernanda Lima Alencar',
    email: 'fernanda.alencar@pucciambiental.com.br',
    role_title: 'Analista de Departamento Pessoal Sênior',
    department_id: 'dept-rh',
    department_name: 'Recursos Humanos',
    status: 'active',
    admission_date: '2023-01-10',
    phone: '(11) 96543-2211',
    cpf: '345.678.901-22',
    notes: 'Responsável pela folha, benefícios e ponto dos colaboradores.',
    created: '2023-01-10T08:00:00.000Z',
    updated: new Date().toISOString(),
  },
  {
    id: 'emp-4',
    name: 'Rodrigo Mendonça',
    email: 'rodrigo.mendonca@pucciambiental.com.br',
    role_title: 'Coordenador de Operações de Campo',
    department_id: 'dept-operacoes',
    department_name: 'Operações Ambientais',
    status: 'active',
    admission_date: '2020-08-17',
    phone: '(11) 99876-1122',
    cpf: '456.789.012-33',
    notes: 'Coordena as frentes de campo, logística e segurança de resíduos.',
    created: '2020-08-17T08:00:00.000Z',
    updated: new Date().toISOString(),
  },
  {
    id: 'emp-5',
    name: 'Juliana Beatriz Costa',
    email: 'juliana.costa@pucciambiental.com.br',
    role_title: 'Analista Financeira Plena',
    department_id: 'dept-financeiro',
    department_name: 'Financeiro & Controladoria',
    status: 'on_leave',
    admission_date: '2022-11-20',
    phone: '(11) 98234-9988',
    cpf: '567.890.123-44',
    notes: 'Em licença maternidade com retorno previsto para o próximo trimestre.',
    created: '2022-11-20T08:00:00.000Z',
    updated: new Date().toISOString(),
  },
  {
    id: 'emp-6',
    name: 'Lucas Henrique Ribeiro',
    email: 'lucas.ribeiro@pucciambiental.com.br',
    role_title: 'Consultor Comercial Corporativo',
    department_id: 'dept-comercial',
    department_name: 'Comercial & Novos Negócios',
    status: 'active',
    admission_date: '2023-09-04',
    phone: '(11) 97766-3322',
    cpf: '678.901.234-55',
    notes: 'Atendimento a clientes industriais de São Paulo e região metropolitana.',
    created: '2023-09-04T08:00:00.000Z',
    updated: new Date().toISOString(),
  },
  {
    id: 'emp-7',
    name: 'Tatiane Cristina Nogueira',
    email: 'tatiane.nogueira@pucciambiental.com.br',
    role_title: 'Técnica em Segurança do Trabalho',
    department_id: 'dept-operacoes',
    department_name: 'Operações Ambientais',
    status: 'inactive',
    admission_date: '2021-05-10',
    phone: '(11) 99112-4455',
    cpf: '789.012.345-66',
    notes: 'Desligada da operação; manter histórico no cadastro.',
    created: '2021-05-10T08:00:00.000Z',
    updated: new Date().toISOString(),
  },
]

// Auxiliares de Storage Seguro
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return defaultValue
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error('Falha ao salvar no storage:', err)
  }
}

// ----------------------------------------------------
// SERVIÇO DE AUTENTICAÇÃO
// ----------------------------------------------------

export const authService = {
  // Retorna sessão atual ou null
  getCurrentUser(): UserSession | null {
    // 1. Tentar ler do PocketBase nativo
    if (pb.authStore.isValid && pb.authStore.record) {
      const rec = pb.authStore.record as {
        id: string
        email: string
        name?: string
        role?: Role
      }
      return {
        id: rec.id,
        email: rec.email,
        name: rec.name || rec.email.split('@')[0],
        role: (rec.role as Role) || 'champion',
        token: pb.authStore.token,
      }
    }

    // 2. Fallback de sessão local armazenada
    return getFromStorage<UserSession | null>(LOCAL_SESSION_KEY, null)
  },

  // Efetua login (tenta PocketBase primeiro, depois valida admin/demo local)
  async login(email: string, pass: string): Promise<UserSession> {
    const cleanEmail = email.trim().toLowerCase()

    // 1. Tenta autenticação nativa do PocketBase
    try {
      const authData = await pb.collection('users').authWithPassword(cleanEmail, pass)
      const user: UserSession = {
        id: authData.record.id,
        email: authData.record.email,
        name: (authData.record.get?.('name') || authData.record.name) || cleanEmail.split('@')[0],
        role: ((authData.record.get?.('role') || authData.record.role) as Role) || 'champion',
        token: authData.token,
      }
      setToStorage(LOCAL_SESSION_KEY, user)
      return user
    } catch {
      // Se falhar no PB (ex.: credencial demo, offline ou usuário pré-definido)
      const customUsers = getFromStorage<Array<{ email: string; pass: string; name: string; role: Role }>>(
        LOCAL_USERS_KEY,
        [],
      )
      const found = customUsers.find(
        (u) => u.email.toLowerCase() === cleanEmail && u.pass === pass,
      )

      if (found) {
        const user: UserSession = {
          id: 'user-' + btoa(found.email).slice(0, 10),
          email: found.email,
          name: found.name,
          role: found.role,
        }
        setToStorage(LOCAL_SESSION_KEY, user)
        return user
      }

      // Credenciais predefinidas para conveniência e testes internos
      if (
        (cleanEmail === 'marcela@pucciambiental.com.br' && pass === 'Pucci@2025') ||
        (cleanEmail === 'admin@pucciambiental.com.br' && pass === 'Admin@123') ||
        (cleanEmail === 'admin@rhpucci.com.br' && pass === 'Admin@123') ||
        (cleanEmail === 'demo@rhpucci.com.br' && pass === 'Pucci@2025')
      ) {
        const user: UserSession = {
          id: 'admin-pucci',
          email: cleanEmail,
          name: cleanEmail.includes('marcela') ? 'Marcela Pucci' : 'Administrador RH',
          role: 'champion',
        }
        setToStorage(LOCAL_SESSION_KEY, user)
        return user
      }

      throw new Error(
        'E-mail ou senha incorretos. Utilize as credenciais de teste fornecidas na tela ou cadastre um acesso.',
      )
    }
  },

  // Cadastro de primeiro admin ou novo usuário de acesso
  async registerAdmin(email: string, pass: string, name: string): Promise<UserSession> {
    const cleanEmail = email.trim().toLowerCase()

    // 1. Tentar criar via endpoint /backend/v1/security/bootstrap se disponível
    try {
      const res = await fetch(`${pb.baseUrl}/backend/v1/security/bootstrap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: pass, name }),
      })
      if (res.ok) {
        // Loga em seguida
        return await this.login(cleanEmail, pass)
      }
    } catch {
      // continua para fallback
    }

    // 2. Salva localmente para garantir o acesso imediato
    const customUsers = getFromStorage<Array<{ email: string; pass: string; name: string; role: Role }>>(
      LOCAL_USERS_KEY,
      [],
    )
    const exists = customUsers.some((u) => u.email.toLowerCase() === cleanEmail)
    if (exists) {
      throw new Error('Já existe um usuário cadastrado com este e-mail.')
    }

    customUsers.push({
      email: cleanEmail,
      pass,
      name,
      role: 'champion',
    })
    setToStorage(LOCAL_USERS_KEY, customUsers)

    const user: UserSession = {
      id: 'user-' + Date.now().toString(36),
      email: cleanEmail,
      name,
      role: 'champion',
    }
    setToStorage(LOCAL_SESSION_KEY, user)
    return user
  },

  // Logout
  logout(): void {
    pb.authStore.clear()
    localStorage.removeItem(LOCAL_SESSION_KEY)
  },
}

// ----------------------------------------------------
// SERVIÇO DE SETORES / DEPARTAMENTOS
// ----------------------------------------------------

export const departmentService = {
  async list(): Promise<Department[]> {
    // 1. Tenta carregar do PocketBase se existir a collection
    try {
      const records = await pb.collection('departments').getFullList<Department>({
        sort: 'name',
      })
      if (records && records.length > 0) {
        setToStorage(LOCAL_DEPTS_KEY, records)
        return records
      }
    } catch {
      // Collection pode não existir ou usuário offline; recorre ao storage local
    }

    // 2. Fallback de storage local
    let list = getFromStorage<Department[]>(LOCAL_DEPTS_KEY, [])
    if (list.length === 0) {
      list = INITIAL_DEPARTMENTS
      setToStorage(LOCAL_DEPTS_KEY, list)
    }
    return list
  },

  async create(data: Omit<Department, 'id' | 'created' | 'updated'>): Promise<Department> {
    const newDept: Department = {
      ...data,
      id: 'dept-' + Math.random().toString(36).substring(2, 9),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    try {
      const created = await pb.collection('departments').create<Department>(newDept)
      if (created) return created
    } catch {
      // segue para local
    }

    const current = await this.list()
    const updated = [...current, newDept]
    setToStorage(LOCAL_DEPTS_KEY, updated)
    return newDept
  },

  async update(id: string, data: Partial<Department>): Promise<Department> {
    try {
      const updatedPb = await pb.collection('departments').update<Department>(id, data)
      if (updatedPb) return updatedPb
    } catch {
      // segue para local
    }

    const current = await this.list()
    const index = current.findIndex((d) => d.id === id)
    if (index === -1) throw new Error('Departamento não encontrado.')

    const updatedDept: Department = {
      ...current[index],
      ...data,
      updated: new Date().toISOString(),
    }
    current[index] = updatedDept
    setToStorage(LOCAL_DEPTS_KEY, current)
    return updatedDept
  },

  async delete(id: string): Promise<void> {
    try {
      await pb.collection('departments').delete(id)
    } catch {
      // segue para local
    }

    const current = await this.list()
    const filtered = current.filter((d) => d.id !== id)
    setToStorage(LOCAL_DEPTS_KEY, filtered)
  },
}

// ----------------------------------------------------
// SERVIÇO DE COLABORADORES (EMPLOYEES)
// ----------------------------------------------------

export const employeeService = {
  async list(): Promise<Employee[]> {
    // 1. Tentar buscar do PocketBase
    try {
      const records = await pb.collection('employees').getFullList<Employee>({
        sort: '-admission_date',
      })
      if (records && records.length > 0) {
        setToStorage(LOCAL_EMPLOYEES_KEY, records)
        return records
      }
    } catch {
      // fallback
    }

    let list = getFromStorage<Employee[]>(LOCAL_EMPLOYEES_KEY, [])
    if (list.length === 0) {
      list = INITIAL_EMPLOYEES
      setToStorage(LOCAL_EMPLOYEES_KEY, list)
    }
    return list
  },

  async getById(id: string): Promise<Employee | null> {
    const list = await this.list()
    return list.find((e) => e.id === id) || null
  },

  async create(data: Omit<Employee, 'id' | 'created' | 'updated'>): Promise<Employee> {
    const newEmp: Employee = {
      ...data,
      id: 'emp-' + Math.random().toString(36).substring(2, 9),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    try {
      const createdPb = await pb.collection('employees').create<Employee>(newEmp)
      if (createdPb) return createdPb
    } catch {
      // segue para local
    }

    const current = await this.list()
    const updated = [newEmp, ...current]
    setToStorage(LOCAL_EMPLOYEES_KEY, updated)
    return newEmp
  },

  async update(id: string, data: Partial<Employee>): Promise<Employee> {
    try {
      const updatedPb = await pb.collection('employees').update<Employee>(id, data)
      if (updatedPb) return updatedPb
    } catch {
      // segue para local
    }

    const current = await this.list()
    const index = current.findIndex((e) => e.id === id)
    if (index === -1) throw new Error('Colaborador não encontrado.')

    const updatedEmp: Employee = {
      ...current[index],
      ...data,
      updated: new Date().toISOString(),
    }
    current[index] = updatedEmp
    setToStorage(LOCAL_EMPLOYEES_KEY, current)
    return updatedEmp
  },

  async toggleStatus(id: string, currentStatus: EmployeeStatus): Promise<Employee> {
    const nextStatus: EmployeeStatus = currentStatus === 'active' ? 'inactive' : 'active'
    return this.update(id, { status: nextStatus })
  },

  async delete(id: string): Promise<void> {
    try {
      await pb.collection('employees').delete(id)
    } catch {
      // segue para local
    }

    const current = await this.list()
    const filtered = current.filter((e) => e.id !== id)
    setToStorage(LOCAL_EMPLOYEES_KEY, filtered)
  },
}
