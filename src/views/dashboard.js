import React, { useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import UserContext from '../UserContext';
import useMountEffect from '../utils/useMountEffect';
import { MODULE_DATA } from '../components/DashboardModule/data';
import DashboardModule from '../components/DashboardModule';
import Collapsible from '../components/Collapsible';
import RequestItem from '../components/RequestItem';
import NewStaffItem from '../components/NewStaffItem';

const makeAuthHeaders = ({ user }) => ({ headers: { 'Authorization': `Bearer ${user.accessJwt}` } });

export const Dashboard = (props) => {
    const [modalActive, setModalActive] = useState({
        visible: false,
        id: NaN,
    });
    const [staffList, setStaffList] = useState([]);
    const [unstaffedTenants, setUnstaffedTenants] = useState([]);
    const [widgetData, setWidgetData] = useState([]);
    const [areStaffAssigned, setAreStaffAssigned] = useState(false);
    const [usersPending, setUsersPending] = useState([]);
    const history = useHistory();
    const userContext = useContext(UserContext);

    useMountEffect(() => {
        axios
            .get("/api/tenants", makeAuthHeaders(userContext))
            .then(({ data }) => {
                const unstaffed = data.tenants.filter(tenant => !tenant.staff);
                if (!unstaffed.length) return;

                setUnstaffedTenants(unstaffed);
                const adminUsersObj = { "userrole": 4 };
                return axios
                    .post("/api/users/role", adminUsersObj, makeAuthHeaders(userContext))
                    .then(({ data }) => setStaffList(data.users));
            })
            .catch(error => alert(error));

        const pendingUsersObj = { "userrole": 0 };
        axios
            .get("/api/widgets", makeAuthHeaders(userContext))
            .then(({ data }) => {
                setWidgetData(data);
            })
            .catch(error => alert(error));

        axios
            .post("/api/users/role", pendingUsersObj, makeAuthHeaders(userContext))
            .then(({ data }) => setUsersPending(data.users))
            .catch(error => alert(error));
    });

    const handleAddClick = (id) => {
        const path = '/request-access/' + id;
        history.push(path, usersPending.find(u => u.id === id));
    }

    const handleDeclineClick = (id) => {
        setModalActive({
            visible: true,
            id: id,
        });
    }

    const handleDenyAccess = async (doDeny) => {

        //Hide modal on button click
        setModalActive({ ...modalActive, visible: false });

        try {
            // If decline access request is confirmed, delete requesting user from the database 
            if (doDeny) {
                const requestorId = modalActive.id;
                const { data } = await axios.delete(`/api/user/${requestorId}`, makeAuthHeaders(userContext));

                // If delete is successful, update state of usersPending, filtering out deleted user
                if (data.Message === "User deleted") setUsersPending(usersPending.filter(user => user.id !== requestorId));
            }
        }
        catch (err) {
            alert("There was an error processing your request. Please try again later");
        }
    }

    const handleStaffAssignmentChange = ({ target }, tenantId) => {
        const updatedTenants = unstaffedTenants.map(tenant => {
            if (tenant.id === tenantId) {
                tenant.staff = target.value;
                setAreStaffAssigned(true);
            }
            return tenant
        });
        setUnstaffedTenants(updatedTenants);
    }

    const handleStaffAssignment = () => {
        if (!areStaffAssigned) return;

        const tenantUpdateReqs = unstaffedTenants
            .filter(({ staff }) => staff)
            .map(({ id, staff }) => axios
                .put(
                    `/api/tenants/${id}`,
                    { 'staffIDs': [staff] },
                    makeAuthHeaders(userContext)
                ));

        axios.all(tenantUpdateReqs)
            .then(axios.spread((...responses) => {
                const stillUnstaffed = unstaffedTenants.filter(tenant => {
                    const isTenantUnchanged = !(responses.find(({ data }) => data.id === tenant.id));
                    return isTenantUnchanged;
                });
                setUnstaffedTenants(stillUnstaffed);
            }))
            .catch(errors => alert(errors));
    }

    return (
        <>
            <div>
                <h2 className="page-title">Admin Dashboard</h2>
                <div className="dashboard__modules_container">
                    <DashboardModule
                        data={widgetData.opentickets}
                    />
                    <DashboardModule
                        data={widgetData.reports}
                    />
                    <DashboardModule
                        data={widgetData.managers}
                    />
                </div>
                <Collapsible
                    title="New Staff Assignments"
                    count={unstaffedTenants.length}
                >
                    <div className="dashboard__assignments_container">
                        {
                            unstaffedTenants.map(tenant => (
                                <NewStaffItem key={tenant.id} {...tenant} handleStaffAssignmentChange={handleStaffAssignmentChange} staffList={staffList} />
                            ))
                        }
                        <div className="dashboard__assignments_button_container">
                            <button
                                className={`button is-primary is-rounded`}
                                disabled={!areStaffAssigned}
                                onClick={handleStaffAssignment}
                            >
                                SAVE ASSIGNMENTS
                            </button>
                        </div>
                    </div>
                </Collapsible>
                <Collapsible
                    title="Request for Access"
                    count={usersPending.length}
                >
                    {
                        usersPending.map((requestItemData, index) => {
                            return (<RequestItem key={`requestItem--${index}`} data={requestItemData} onDeclineClick={handleDeclineClick} onAddClick={handleAddClick} />);
                        })
                    }
                </Collapsible>
            </div>
            <div className={`modal ${modalActive.visible && 'is-active'}`}>
                <div className="modal-background" onClick={() => { handleDenyAccess(false) }}></div>
                <div className="modal-content">
                    <div className="modal__message_container">
                        <div className="modal__message">
                            <h4>Are you sure you want to decline access?</h4>
                        </div>
                        <div className="modal__button_container">
                            <button className="button is-primary is-rounded" onClick={() => { handleDenyAccess(true) }}>YES</button>
                            <button className="button is-dark is-rounded" onClick={() => { handleDenyAccess(false) }}>NO</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
