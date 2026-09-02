export interface UserInfo { id: string; usuario: string; nombre: string }
let _user: UserInfo | null = null
export function getAuth(): UserInfo | null { return _user }
export function setAuth(user: UserInfo | null) { _user = user }
