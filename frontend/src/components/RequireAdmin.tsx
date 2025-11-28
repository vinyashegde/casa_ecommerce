import React from 'react'
import { Navigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'

const RequireAdmin = ({ children }: {children: React.ReactNode }) => {

    const { userData } = useUser()

    if (!userData || userData.role !== 2) {
        return <Navigate to="/admin/login" replace />
    }

    return <>{children}</>
}

export default RequireAdmin;