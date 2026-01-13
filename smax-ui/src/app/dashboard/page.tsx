'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface RequestItem {
  id: string
  displayLabel: string
  isDeleted: boolean
}

interface ContractItem {
  id: string
  displayLabel: string
  isDeleted: boolean
}

interface PersonGroupItem {
  id: string
  name: string
  isDeleted: boolean
}

// Custom TimeInput component that forces 24-hour format
const TimeInput = ({ value, onChange, style }: { value: string; onChange: (value: string) => void; style: React.CSSProperties }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.replace(/[^\d:]/g, '') // Remove non-digit/non-colon characters
    
    // Auto-format as user types
    if (inputValue.length <= 2 && !inputValue.includes(':')) {
      // Just hours typed
      const hours = parseInt(inputValue)
      if (inputValue.length === 2 && hours <= 23) {
        inputValue = inputValue + ':'
      } else if (hours > 23) {
        inputValue = '23:'
      }
    } else if (inputValue.includes(':')) {
      const parts = inputValue.split(':')
      // Limit hours to 2 digits and max 23
      if (parts[0].length > 2) {
        parts[0] = parts[0].substring(0, 2)
      }
      if (parts[0] && parseInt(parts[0]) > 23) {
        parts[0] = '23'
      }
      // Limit minutes to 2 digits and max 59
      if (parts[1] && parts[1].length > 2) {
        parts[1] = parts[1].substring(0, 2)
      }
      if (parts[1] && parseInt(parts[1]) > 59) {
        parts[1] = '59'
      }
      inputValue = parts.join(':')
    }
    
    // Allow any valid intermediate state
    onChange(inputValue)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Ensure format is complete on blur
    const parts = e.target.value.split(':')
    if (parts.length === 2) {
      const hours = parts[0].padStart(2, '0')
      const minutes = parts[1].padStart(2, '0')
      if (parseInt(hours) <= 23 && parseInt(minutes) <= 59) {
        onChange(`${hours}:${minutes}`)
      } else {
        // Reset to empty if invalid
        onChange('')
      }
    } else if (parts.length === 1 && parts[0] && !parts[0].includes(':')) {
      // Only hours entered, add colon
      const hours = parts[0].padStart(2, '0')
      if (parseInt(hours) <= 23) {
        onChange(`${hours}:00`)
      } else {
        onChange('')
      }
    }
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="HH:MM"
      pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
      style={{ ...style, width: '100%' }}
    />
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [filteredRequests, setFilteredRequests] = useState<RequestItem[]>([])
  const [selectedValue, setSelectedValue] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [createNew, setCreateNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [contractId, setContractId] = useState<string>('')
  const [contractName, setContractName] = useState<string>('')
  const [loadingContract, setLoadingContract] = useState(false)
  const [effortExplanation, setEffortExplanation] = useState<string>('')
  const [effortStartDate, setEffortStartDate] = useState<string>('')
  const [effortStartTime, setEffortStartTime] = useState<string>('')
  const [effortEndDate, setEffortEndDate] = useState<string>('')
  const [effortEndTime, setEffortEndTime] = useState<string>('')
  const [scheduled, setScheduled] = useState(false)
  const [showScheduledExplanation, setShowScheduledExplanation] = useState(false)
  const [contracts, setContracts] = useState<ContractItem[]>([])
  const [filteredContracts, setFilteredContracts] = useState<ContractItem[]>([])
  const [selectedContract, setSelectedContract] = useState<string>('')
  const [contractSearchTerm, setContractSearchTerm] = useState<string>('')
  const [loadingContracts, setLoadingContracts] = useState(false)
  const [newContractName, setNewContractName] = useState<string>('')
  const [newContractDescription, setNewContractDescription] = useState<string>('')
  const [personGroups, setPersonGroups] = useState<PersonGroupItem[]>([])
  const [filteredPersonGroups, setFilteredPersonGroups] = useState<PersonGroupItem[]>([])
  const [selectedPersonGroup, setSelectedPersonGroup] = useState<string>('')
  const [personGroupSearchTerm, setPersonGroupSearchTerm] = useState<string>('')
  const [loadingPersonGroups, setLoadingPersonGroups] = useState(false)

  useEffect(() => {
    fetchRequests()
    fetchPerson()
  }, [])

  useEffect(() => {
    // Fetch contract when a request is selected and create new is not checked
    if (selectedValue && !createNew) {
      fetchContract(selectedValue)
    } else {
      // Clear contract when deselected or create new is checked
      setContractId('')
      setContractName('')
    }
  }, [selectedValue, createNew])

  useEffect(() => {
    // Fetch contracts when "Create New" is checked
    if (createNew) {
      fetchContracts()
    } else {
      // Clear contracts when "Create New" is unchecked
      setContracts([])
      setFilteredContracts([])
      setSelectedContract('')
      setContractSearchTerm('')
      setNewContractName('')
      setNewContractDescription('')
      setPersonGroups([])
      setFilteredPersonGroups([])
      setSelectedPersonGroup('')
      setPersonGroupSearchTerm('')
    }
  }, [createNew])

  useEffect(() => {
    // Filter contracts based on search term
    if (contractSearchTerm.trim() === '') {
      setFilteredContracts(contracts)
    } else {
      const filtered = contracts.filter(contract =>
        contract.displayLabel.toLowerCase().includes(contractSearchTerm.toLowerCase()) ||
        contract.id.toLowerCase().includes(contractSearchTerm.toLowerCase())
      )
      setFilteredContracts(filtered)
    }
  }, [contractSearchTerm, contracts])

  useEffect(() => {
    // Fetch person groups when a contract is selected
    if (selectedContract) {
      fetchPersonGroups()
    } else {
      // Clear person groups when contract is deselected
      setPersonGroups([])
      setFilteredPersonGroups([])
      setSelectedPersonGroup('')
      setPersonGroupSearchTerm('')
    }
  }, [selectedContract])

  useEffect(() => {
    // Filter person groups based on search term
    if (personGroupSearchTerm.trim() === '') {
      setFilteredPersonGroups(personGroups)
    } else {
      const filtered = personGroups.filter(group =>
        group.name.toLowerCase().includes(personGroupSearchTerm.toLowerCase()) ||
        group.id.toLowerCase().includes(personGroupSearchTerm.toLowerCase())
      )
      setFilteredPersonGroups(filtered)
    }
  }, [personGroupSearchTerm, personGroups])

  useEffect(() => {
    // Filter requests based on search term
    if (searchTerm.trim() === '') {
      setFilteredRequests(requests)
    } else {
      const filtered = requests.filter(req =>
        req.displayLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredRequests(filtered)
    }
  }, [searchTerm, requests])

  const fetchRequests = async () => {
    try {
      const xsrf_token = localStorage.getItem('xsrf_token')
      if (!xsrf_token) {
        alert('No session found. Please login again.')
        return
      }

      const response = await fetch('http://localhost:8080/api/requests', {
        method: 'GET',
        headers: {
          'X-XSRF-Token': xsrf_token,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setRequests(data.requests)
        setFilteredRequests(data.requests)
      } else {
        alert(data.detail || 'Failed to fetch requests')
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      alert('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const fetchPerson = async () => {
    try {
      const xsrf_token = localStorage.getItem('xsrf_token')
      if (!xsrf_token) {
        return
      }

      const response = await fetch('http://localhost:8080/api/person', {
        method: 'GET',
        headers: {
          'X-XSRF-Token': xsrf_token,
        },
      })

      const data = await response.json()

      if (response.ok && data.success && data.name) {
        setUserName(data.name)
        setUserId(data.id || '')
      }
    } catch (error) {
      console.error('Error fetching person:', error)
    }
  }

  const fetchContract = async (requestId: string) => {
    try {
      setLoadingContract(true)
      const xsrf_token = localStorage.getItem('xsrf_token')
      if (!xsrf_token) {
        return
      }

      const response = await fetch('http://localhost:8080/api/contract', {
        method: 'POST',
        headers: {
          'X-XSRF-Token': xsrf_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request_id: requestId }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setContractId(data.contract_id || '')
        setContractName(data.contract_name || '')
      } else {
        setContractId('')
        setContractName('')
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
      setContractId('')
      setContractName('')
    } finally {
      setLoadingContract(false)
    }
  }

  const fetchContracts = async () => {
    try {
      setLoadingContracts(true)
      const xsrf_token = localStorage.getItem('xsrf_token')
      if (!xsrf_token) {
        return
      }

      const response = await fetch('http://localhost:8080/api/contracts', {
        method: 'GET',
        headers: {
          'X-XSRF-Token': xsrf_token,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setContracts(data.contracts)
        setFilteredContracts(data.contracts)
      } else {
        alert(data.detail || 'Failed to fetch contracts')
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
      alert('Failed to connect to server')
    } finally {
      setLoadingContracts(false)
    }
  }

  const fetchPersonGroups = async () => {
    try {
      setLoadingPersonGroups(true)
      const xsrf_token = localStorage.getItem('xsrf_token')
      if (!xsrf_token) {
        return
      }

      const response = await fetch('http://localhost:8080/api/person-groups', {
        method: 'GET',
        headers: {
          'X-XSRF-Token': xsrf_token,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setPersonGroups(data.personGroups)
        setFilteredPersonGroups(data.personGroups)
      } else {
        alert(data.detail || 'Failed to fetch person groups')
      }
    } catch (error) {
      console.error('Error fetching person groups:', error)
      alert('Failed to connect to server')
    } finally {
      setLoadingPersonGroups(false)
    }
  }

  const isFormValid = () => {
    if (createNew) {
      // For "Create new" flow: contract, person group, name, description, and all effort fields
      return (
        selectedContract &&
        selectedPersonGroup &&
        newContractName &&
        newContractDescription &&
        effortExplanation &&
        effortStartDate &&
        effortStartTime &&
        effortEndDate &&
        effortEndTime
      )
    } else {
      // For normal flow: request selected, contract shown, and all effort fields
      return (
        selectedValue &&
        contractId &&
        effortExplanation &&
        effortStartDate &&
        effortStartTime &&
        effortEndDate &&
        effortEndTime
      )
    }
  }

  const handleSend = async () => {
    if (!isFormValid()) {
      alert('Please fill in all required fields')
      return
    }

    const xsrf_token = localStorage.getItem('xsrf_token')
    if (!xsrf_token) {
      alert('No session found. Please login again.')
      return
    }

    // Combine date and time and convert to timestamp (milliseconds)
    const startDateTime = `${effortStartDate}T${effortStartTime}`
    const endDateTime = `${effortEndDate}T${effortEndTime}`
    const startTimestamp = new Date(startDateTime).getTime()
    const endTimestamp = new Date(endDateTime).getTime()

    let sendData: any = {
      userId: userId,
      userName: userName,
      effortExplanation: effortExplanation,
      effortStartDate: startTimestamp,
      effortEndDate: endTimestamp,
      scheduled: scheduled,
    }

    if (createNew) {
      // "Create new" flow data
      sendData = {
        ...sendData,
        createNew: true,
        contractId: selectedContract,
        personGroupId: selectedPersonGroup,
        name: newContractName,
        description: newContractDescription,
      }
    } else {
      // Normal flow data
      sendData = {
        ...sendData,
        createNew: false,
        requestId: selectedValue,
        contractId: contractId,
      }
    }

    try {
      const response = await fetch('http://localhost:8080/api/send', {
        method: 'POST',
        headers: {
          'X-XSRF-Token': xsrf_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert('Data sent successfully!')
      } else {
        alert(data.detail || 'Failed to send data')
      }
    } catch (error) {
      console.error('Error sending data:', error)
      alert('Failed to connect to server')
    }
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2rem',
      position: 'relative',
    }}>
      <button
        type="button"
        onClick={() => router.push('/')}
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: 'bold',
          backgroundColor: '#000000',
          color: '#ffffff',
          border: '2px solid #ffffff',
          cursor: 'pointer',
          fontFamily: 'Arial, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.textDecoration = 'underline'
          e.currentTarget.style.backgroundColor = '#ffffff'
          e.currentTarget.style.color = '#000000'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = 'none'
          e.currentTarget.style.backgroundColor = '#000000'
          e.currentTarget.style.color = '#ffffff'
        }}
      >
        Back to Login
      </button>
      {userName && (
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1rem',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '1.2rem',
        }}>
          {userName}
        </div>
      )}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '100%',
        maxWidth: '800px',
      }}>
        {loading ? (
          <div style={{ color: '#ffffff', textAlign: 'center' }}>Loading requests...</div>
        ) : (
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={createNew}
              style={{
                padding: '1rem',
                fontSize: '1.2rem',
                backgroundColor: createNew ? '#333333' : '#000000',
                color: createNew ? '#888888' : '#ffffff',
                border: '2px solid #ffffff',
                outline: 'none',
                fontFamily: 'Arial, sans-serif',
                width: '200px',
                position: 'absolute',
                left: 0,
                opacity: createNew ? 0.5 : 1,
                cursor: createNew ? 'not-allowed' : 'text',
              }}
            />

            <select
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
              disabled={createNew}
              style={{
                padding: '1rem',
                fontSize: '1.2rem',
                backgroundColor: createNew ? '#333333' : '#000000',
                color: createNew ? '#888888' : '#ffffff',
                border: '2px solid #ffffff',
                outline: 'none',
                fontFamily: 'Arial, sans-serif',
                cursor: createNew ? 'not-allowed' : 'pointer',
                width: '400px',
                opacity: createNew ? 0.5 : 1,
              }}
            >
              <option value="" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                Select a request
              </option>
              {filteredRequests.map((req) => (
                <option
                  key={req.id}
                  value={req.id}
                  style={{ backgroundColor: '#000000', color: '#ffffff' }}
                >
                  {req.id}: {req.displayLabel} {req.isDeleted ? '(Deleted)' : ''}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setCreateNew(!createNew)}
              style={{
                padding: '1rem 1.5rem',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                backgroundColor: createNew ? '#ffffff' : '#000000',
                color: createNew ? '#000000' : '#ffffff',
                border: '2px solid #ffffff',
                cursor: 'pointer',
                fontFamily: 'Arial, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                position: 'absolute',
                right: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none'
              }}
            >
              Create new
            </button>
          </div>
        )}

        {createNew && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            width: '100%',
          }}>
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              width: '100%',
            }}>
              <input
                type="text"
                placeholder="Search contracts..."
                value={contractSearchTerm}
                onChange={(e) => setContractSearchTerm(e.target.value)}
                style={{
                  padding: '1rem',
                  fontSize: '1.2rem',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  border: '2px solid #ffffff',
                  outline: 'none',
                  fontFamily: 'Arial, sans-serif',
                  width: '200px',
                  position: 'absolute',
                  left: 0,
                }}
              />
              {loadingContracts ? (
                <div style={{ color: '#ffffff', textAlign: 'center', width: '100%' }}>Loading contracts...</div>
              ) : (
                <select
                  value={selectedContract}
                  onChange={(e) => setSelectedContract(e.target.value)}
                  style={{
                    padding: '1rem',
                    fontSize: '1.2rem',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    outline: 'none',
                    fontFamily: 'Arial, sans-serif',
                    cursor: 'pointer',
                    width: '100%',
                    marginLeft: '200px',
                  }}
                >
                  <option value="" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                    Select a contract
                  </option>
                  {filteredContracts.map((contract) => (
                    <option
                      key={contract.id}
                      value={contract.id}
                      style={{ backgroundColor: '#000000', color: '#ffffff' }}
                    >
                      {contract.id}: {contract.displayLabel} {contract.isDeleted ? '(Deleted)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {selectedContract && (
              <>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  width: '100%',
                }}>
                  <input
                    type="text"
                    placeholder="Search person groups..."
                    value={personGroupSearchTerm}
                    onChange={(e) => setPersonGroupSearchTerm(e.target.value)}
                    style={{
                      padding: '1rem',
                      fontSize: '1.2rem',
                      backgroundColor: '#000000',
                      color: '#ffffff',
                      border: '2px solid #ffffff',
                      outline: 'none',
                      fontFamily: 'Arial, sans-serif',
                      width: '200px',
                      position: 'absolute',
                      left: 0,
                    }}
                  />
                  {loadingPersonGroups ? (
                    <div style={{ color: '#ffffff', textAlign: 'center', width: '100%' }}>Loading person groups...</div>
                  ) : (
                    <select
                      value={selectedPersonGroup}
                      onChange={(e) => setSelectedPersonGroup(e.target.value)}
                      style={{
                        padding: '1rem',
                        fontSize: '1.2rem',
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        border: '2px solid #ffffff',
                        outline: 'none',
                        fontFamily: 'Arial, sans-serif',
                        cursor: 'pointer',
                        width: '100%',
                        marginLeft: '200px',
                      }}
                    >
                      <option value="" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                        Select a person group
                      </option>
                      {filteredPersonGroups.map((group) => (
                        <option
                          key={group.id}
                          value={group.id}
                          style={{ backgroundColor: '#000000', color: '#ffffff' }}
                        >
                          {group.id}: {group.name} {group.isDeleted ? '(Deleted)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Name"
                  value={newContractName}
                  onChange={(e) => setNewContractName(e.target.value)}
                  style={{
                    padding: '1rem',
                    fontSize: '1.2rem',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    outline: 'none',
                    fontFamily: 'Arial, sans-serif',
                    width: '100%',
                  }}
                />

                <input
                  type="text"
                  placeholder="Description"
                  value={newContractDescription}
                  onChange={(e) => setNewContractDescription(e.target.value)}
                  style={{
                    padding: '1rem',
                    fontSize: '1.2rem',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    outline: 'none',
                    fontFamily: 'Arial, sans-serif',
                    width: '100%',
                  }}
                />

                {selectedContract && selectedPersonGroup && newContractName && newContractDescription && (
                  <>
                    <input
                      type="text"
                      placeholder="Effort Explanation"
                      value={effortExplanation}
                      onChange={(e) => setEffortExplanation(e.target.value)}
                      style={{
                        padding: '1rem',
                        fontSize: '1.2rem',
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        border: '2px solid #ffffff',
                        outline: 'none',
                        fontFamily: 'Arial, sans-serif',
                        width: '100%',
                      }}
                    />

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      width: '100%',
                    }}>
                      <button
                        type="button"
                        onClick={() => setScheduled(!scheduled)}
                        style={{
                          padding: '1rem 1.5rem',
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          backgroundColor: scheduled ? '#ffffff' : '#000000',
                          color: scheduled ? '#000000' : '#ffffff',
                          border: '2px solid #ffffff',
                          cursor: 'pointer',
                          fontFamily: 'Arial, sans-serif',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline'
                          setShowScheduledExplanation(true)
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none'
                          setShowScheduledExplanation(false)
                        }}
                      >
                        Scheduled
                      </button>
                      {showScheduledExplanation && (
                        <div style={{
                          color: '#ffffff',
                          fontFamily: 'Arial, sans-serif',
                          fontSize: '1rem',
                          flex: 1,
                        }}>
                          When enabled, creates separate effort entries for each day between start and end dates, using the same start and end times for each day. Example: 13th May 15:00 to 16th May 17:00 creates entries for 13th, 14th, and 15th May (15:00 to 17:00 each day).
                        </div>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      width: '100%',
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        flex: 1,
                      }}>
                        <label style={{
                          color: '#ffffff',
                          fontFamily: 'Arial, sans-serif',
                          fontSize: '1rem',
                        }}>
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={effortStartDate}
                          onChange={(e) => setEffortStartDate(e.target.value)}
                          style={{
                            padding: '1rem',
                            fontSize: '1.2rem',
                            backgroundColor: '#000000',
                            color: '#ffffff',
                            border: '2px solid #ffffff',
                            outline: 'none',
                            fontFamily: 'Arial, sans-serif',
                          }}
                        />
                      </div>

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        flex: 1,
                      }}>
                        <label style={{
                          color: '#ffffff',
                          fontFamily: 'Arial, sans-serif',
                          fontSize: '1rem',
                        }}>
                          Start Time
                        </label>
                        <TimeInput
                          value={effortStartTime}
                          onChange={setEffortStartTime}
                          style={{
                            padding: '1rem',
                            fontSize: '1.2rem',
                            backgroundColor: '#000000',
                            color: '#ffffff',
                            border: '2px solid #ffffff',
                            outline: 'none',
                            fontFamily: 'Arial, sans-serif',
                          }}
                        />
                      </div>

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        flex: 1,
                      }}>
                        <label style={{
                          color: '#ffffff',
                          fontFamily: 'Arial, sans-serif',
                          fontSize: '1rem',
                        }}>
                          End Date
                        </label>
                        <input
                          type="date"
                          value={effortEndDate}
                          onChange={(e) => setEffortEndDate(e.target.value)}
                          style={{
                            padding: '1rem',
                            fontSize: '1.2rem',
                            backgroundColor: '#000000',
                            color: '#ffffff',
                            border: '2px solid #ffffff',
                            outline: 'none',
                            fontFamily: 'Arial, sans-serif',
                          }}
                        />
                      </div>

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        flex: 1,
                      }}>
                        <label style={{
                          color: '#ffffff',
                          fontFamily: 'Arial, sans-serif',
                          fontSize: '1rem',
                        }}>
                          End Time
                        </label>
                        <TimeInput
                          value={effortEndTime}
                          onChange={setEffortEndTime}
                          style={{
                            padding: '1rem',
                            fontSize: '1.2rem',
                            backgroundColor: '#000000',
                            color: '#ffffff',
                            border: '2px solid #ffffff',
                            outline: 'none',
                            fontFamily: 'Arial, sans-serif',
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {(contractId && contractName) && (
          <>
            <button
              type="button"
              disabled
              style={{
                padding: '1rem',
                fontSize: '1.2rem',
                backgroundColor: '#000000',
                color: '#ffffff',
                border: '2px solid #ffffff',
                cursor: 'default',
                fontFamily: 'Arial, sans-serif',
                width: '100%',
              }}
            >
              {contractId}: {contractName}
            </button>

            <input
              type="text"
              placeholder="Effort Explanation"
              value={effortExplanation}
              onChange={(e) => setEffortExplanation(e.target.value)}
              style={{
                padding: '1rem',
                fontSize: '1.2rem',
                backgroundColor: '#000000',
                color: '#ffffff',
                border: '2px solid #ffffff',
                outline: 'none',
                fontFamily: 'Arial, sans-serif',
                width: '100%',
              }}
            />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              width: '100%',
            }}>
              <button
                type="button"
                onClick={() => setScheduled(!scheduled)}
                style={{
                  padding: '1rem 1.5rem',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  backgroundColor: scheduled ? '#ffffff' : '#000000',
                  color: scheduled ? '#000000' : '#ffffff',
                  border: '2px solid #ffffff',
                  cursor: 'pointer',
                  fontFamily: 'Arial, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline'
                  setShowScheduledExplanation(true)
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none'
                  setShowScheduledExplanation(false)
                }}
              >
                Scheduled
              </button>
              {showScheduledExplanation && (
                <div style={{
                  color: '#ffffff',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '1rem',
                  flex: 1,
                }}>
                  When enabled, creates separate effort entries for each day between start and end dates, using the same start and end times for each day. Example: 13th May 15:00 to 16th May 17:00 creates entries for 13th, 14th, and 15th May (15:00 to 17:00 each day).
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              width: '100%',
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                flex: 1,
              }}>
                <label style={{
                  color: '#ffffff',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '1rem',
                }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={effortStartDate}
                  onChange={(e) => setEffortStartDate(e.target.value)}
                  style={{
                    padding: '1rem',
                    fontSize: '1.2rem',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    outline: 'none',
                    fontFamily: 'Arial, sans-serif',
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                flex: 1,
              }}>
                <label style={{
                  color: '#ffffff',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '1rem',
                }}>
                  Start Time
                </label>
                <TimeInput
                  value={effortStartTime}
                  onChange={setEffortStartTime}
                  style={{
                    padding: '1rem',
                    fontSize: '1.2rem',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    outline: 'none',
                    fontFamily: 'Arial, sans-serif',
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                flex: 1,
              }}>
                <label style={{
                  color: '#ffffff',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '1rem',
                }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={effortEndDate}
                  onChange={(e) => setEffortEndDate(e.target.value)}
                  style={{
                    padding: '1rem',
                    fontSize: '1.2rem',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    outline: 'none',
                    fontFamily: 'Arial, sans-serif',
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                flex: 1,
              }}>
                <label style={{
                  color: '#ffffff',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '1rem',
                }}>
                  End Time
                </label>
                <TimeInput
                  value={effortEndTime}
                  onChange={setEffortEndTime}
                  style={{
                    padding: '1rem',
                    fontSize: '1.2rem',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    outline: 'none',
                    fontFamily: 'Arial, sans-serif',
                  }}
                />
              </div>
            </div>
          </>
        )}

        <button
          onClick={handleSend}
          disabled={loading || !isFormValid()}
          style={{
            padding: '1rem',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            backgroundColor: loading || !isFormValid() ? '#333333' : '#000000',
            color: '#ffffff',
            border: '2px solid #ffffff',
            cursor: loading || !isFormValid() ? 'not-allowed' : 'pointer',
            fontFamily: 'Arial, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            opacity: loading || !isFormValid() ? 0.5 : 1,
            width: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline'
            if (!loading && isFormValid()) {
              e.currentTarget.style.backgroundColor = '#ffffff'
              e.currentTarget.style.color = '#000000'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none'
            if (!loading && isFormValid()) {
              e.currentTarget.style.backgroundColor = '#000000'
              e.currentTarget.style.color = '#ffffff'
            }
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
