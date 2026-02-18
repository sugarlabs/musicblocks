"""
Master script to run all 14 test additions sequentially.
Each test is added one at a time with verification.
"""
import subprocess
import sys
import time

tests = [
    ("01", "Rhythm Beginner"),
    ("02", "Rhythm Advanced"),
    ("03", "Meter Beginner"),
    ("04", "Meter Advanced"),
    ("05", "Pitch Beginner"),
    ("06", "Pitch Advanced"),
    ("07", "Intervals Beginner"),
    ("08", "Intervals Advanced"),
    ("09", "Tone Beginner"),
    ("10", "Tone Advanced"),
    ("11", "Ornament Beginner"),
    ("12", "Ornament Advanced"),
    ("13", "Drum Beginner"),
    ("14", "Drum Advanced"),
]

print("=" * 60)
print("MUSIC BLOCKS TEST SUITE EXPANSION")
print("=" * 60)
print(f"\nThis will add {len(tests)} tests sequentially.")
print("Each test will be verified before proceeding.\n")

input("Press ENTER to start...")

for num, name in tests:
    script_name = f"add_test_{num}_{name.lower().replace(' ', '_')}.py"
    
    print(f"\n[{num}/14] Adding: {name}")
    print(f"Running: {script_name}")
    
    try:
        result = subprocess.run(
            [sys.executable, script_name],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            print(f"✅ SUCCESS: {name}")
            print(result.stdout)
        else:
            print(f"❌ FAILED: {name}")
            print("STDOUT:", result.stdout)
            print("STDERR:", result.stderr)
            
            response = input("\nContinue anyway? (y/n): ")
            if response.lower() != 'y':
                print("\n⚠️  Stopped at test", num)
                sys.exit(1)
    
    except FileNotFoundError:
        print(f"⚠️  Script not found: {script_name}")
        print("Creating missing scripts...")
        break
    except subprocess.TimeoutExpired:
        print(f"⏱️  Timeout - script took too long")
        break
    except Exception as e:
        print(f"❌ Error: {e}")
        break
    
    time.sleep(0.5)  # Brief pause between tests

print("\n" + "=" * 60)
print("COMPLETE!")
print("=" * 60)
print("\n📋 Next steps:")
print("1. Refresh http://127.0.0.1:3000/examples/test-suite.html")
print("2. Click the 'start' block to run all tests")
print("3. Verify all tests pass")
