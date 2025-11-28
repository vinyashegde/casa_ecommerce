import React from 'react'
import { Outlet } from 'react-router-dom'

const AdminLayout = () => {
    return (
        <div className='min-h-screen'>
            <Outlet />
        </div>
    )
}

export default AdminLayout;