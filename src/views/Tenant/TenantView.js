import React, { useEffect, useState } from "react";
import * as Yup from "yup";
import { useParams } from "react-router-dom";
import * as axios from "axios";
import { SearchPanel, SearchPanelVariant } from "react-search-panel";
import ToggleEditTable from "../../components/ToggleEditTable";

// Configure validation schema for edit form
const validationSchema = Yup.object().shape({
  firstName: Yup.string()
    .max(255, "Must be shorter than 255 Characters")
    .required("Must enter a First Name"),
  lastName: Yup.string()
    .max(255, "Must be shorter than 255 Characters")
    .required("Must enter a Last Name"),
  phone: Yup.string()
    .min(
      5,
      "*Number must contain at least 5 digits to be a valid phone/text number",
    )
    .max(20, "*Numbers can't be longer than 20 digits")
    .required("*a valid phone number is required"),
});

const Tenant = () => {
  // Get input tenant id
  const { id } = useParams();

  const initialState = {
    tenant: null,
    property: null,
    tickets: null,
  };

  const [state, setState] = useState(initialState);
  const [isEditing, setEditingStatus] = useState(false);
  const [staffSearchText, setStaffSearchText] = useState("");
  const [staffSearchResults, setStaffSearchResults] = useState([]);
  const [staffSelections, setStaffSelections] = useState(null);

  const tabs = [
    { id: "Ongoing", label: "Ongoing" },
    { id: "Closed", label: "Closed" },
  ];
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  /**
   * Handle activating edit form
   */
  const handleEditToggle = () => setEditingStatus(!isEditing);
  const onFormikSubmit = (values, { setSubmitting }) => {
    setSubmitting(true);
    setState({
      ...state,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      email: values.email,
    });
    setTimeout(() => {
      setSubmitting(false);
      setEditingStatus(false);
    }, 500);
  };

  /**
   * Handle press cancel button
   */
  const onCancelClick = () => {
    setEditingStatus(false);
  };

  /**
   * Convert an array of staff to an array of SearchPanelItems
   * @param {*} staffArray
   */
  const getStaffChoice = (staffArray) => {
    const staffChoices = [];
    if (staffArray && Array.isArray(staffArray)) {
      staffArray.forEach((staff) => {
        const name = `${staff.firstName} ${staff.lastName}`;
        const staffChoice = { key: staff.id, description: name };
        staffChoices.push(staffChoice);
      });
    }
    return staffChoices;
  };

  /**
   * Get a tenant
   */
  const getTenant = async () => {
    const tenantResponse = await axios.get(`/api/tenants/${id}`);
    const tenant = tenantResponse.data;
    const propertyUrl = `/api/properties/${tenant.propertyName}`;
    const propertyResponse = await axios.get(propertyUrl);
    const property = propertyResponse.data;
    const ticketsResponse = await axios.get(`/api/tickets?tenant=${tenant.id}`);
    const tickets = ticketsResponse.data;
    setState({ tenant, property, tickets });

    const currentStaff = getStaffChoice(tenant.staff);

    setStaffSelections(currentStaff);
  };

  /**
   * When component mounts, get tenant.
   */
  useEffect(() => {
    getTenant();
  }, []);

  const { tenant } = state;
  const { property } = state;

  /**
   * Configure edit table
   */
  const getTableData = () => [
    {
      key: "firstName",
      label: "First Name",
      value: tenant.firstName,
      inputType: "text",
    },
    {
      key: "lastName",
      label: "Last Name",
      value: tenant.lastName,
      inputType: "text",
    },
    {
      key: "phone",
      label: "Phone",
      value: tenant.phone,
      inputType: "text",
    },
    {
      key: "address",
      label: "Property",
      value: `${property.address}, ${property.city}, ${property.state}, ${property.zipcode}`,
      inputType: "text",
      comp: <div />,
    },
    {
      key: "unit",
      label: "Unit",
      value: property.unit,
      inputType: "text",
      comp: <div />,
    },
  ];

  /**
   * When staff search input text changes, call API to find matching users.
   */
  useEffect(() => {
    const loadStaff = async () => {
      const staffResponse = await axios.post("/api/users/role", { userrole: 2, name: staffSearchText });
      const foundStaff = await staffResponse.data;
      const foundStaffChoices = getStaffChoice(foundStaff.users);
      setStaffSearchResults(foundStaffChoices);
    };
    if (staffSearchText && staffSearchText.length > 0) {
      loadStaff();
    }
  }, [staffSearchText]);

  /**
   * Handle staff search input
   * @param {*} event
   */
  const handleChangeSearch = (event) => {
    const { value } = event.target;
    if (!value || value.length === 0) {
      setStaffSearchResults([]);
      setStaffSearchText("");
    } else {
      setStaffSearchText(value);
    }
  };

  /**
   * Handle change in staff selections of search panel
   * @param {*} selectedChoices
   */
  const handleChangeStaffSelections = (selectedChoices) => {
    setStaffSelections(selectedChoices);
  };

  return (
    <div className="manager__container">
      {tenant && (
        <div>
          <div className="title__container">
            <h2>
              {tenant.firstName}
              {" "}
              {tenant.lastName}
            </h2>
            <button
              className={`rounded${isEditing ? "--is-editing" : ""}`}
              onClick={handleEditToggle}
              disabled={isEditing}
            >
              <i className="fas fa-pen icon" />
            </button>
          </div>
          <div className="manager__contact">
            <h1 className="secondary-title">CONTACT</h1>
            <div className="contact-details">
              <ToggleEditTable
                tableData={getTableData()}
                validationSchema={validationSchema}
                isEditing={isEditing}
                submitHandler={onFormikSubmit}
                cancelHandler={onCancelClick}
              />
            </div>
          </div>

          <div className="manager__contact">
            <h1 className="secondary-title">JOIN STAFF</h1>
          </div>

          <div>
            <SearchPanel
              chips
              choices={staffSearchResults}
              clearLabel="Clear search text"
              maximumHeight={200}
              onChange={handleChangeSearch}
              onClear={handleChangeSearch}
              onSelectionChange={handleChangeStaffSelections}
              placeholder="Search JOIN staff"
              preSelectedChoices={staffSelections}
              small
              value={staffSearchText}
              variant={SearchPanelVariant.checkbox}
            />
          </div>

          <div className="manager__contact">
            <h1 className="secondary-title">TICKETS</h1>
          </div>

          <div className="tabs">
            <ul>
              {tabs.map((tab) => (
                <li key={tab.id} className={activeTab === tab.id ? "is-active" : ""}>
                  <a href onClick={() => setActiveTab(tab.id)}>{tab.label}</a>
                </li>
              ))}
            </ul>
          </div>

        </div>
      )}
    </div>
  );
};

export default Tenant;
